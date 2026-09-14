# アーキテクチャ・仕様

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite、CSS Modules（UIフレームワークなし）、React Router v7、`lucide-react`（アイコン）
- **バックエンド**: Django 6 + Django REST Framework、SQLite（開発用）、トークン認証（`rest_framework.authtoken`）
- 2つは完全に独立したプロセス。フロントは `http://localhost:5174`、バックエンドは `http://localhost:8000` で動作し、CORS経由で通信します（`backend/config/settings.py` の `CORS_ALLOWED_ORIGINS`）。

## ディレクトリ構成

```
backend/core/
  models.py        全モデル定義
  serializers.py    DRFシリアライザ（バリデーションもここに集約）
  views.py          ViewSet・APIView
  permissions.py    共通権限クラス
  auth_backends.py  社員番号ログイン用の認証バックエンド
  management/commands/seed_mock_data.py  モックデータ投入コマンド

frontend/src/
  lib/api/          APIクライアント層（client.ts / resources.ts / mappers.ts / types.ts）
  lib/AuthContext.tsx  認証状態（ログイン・ログアウト・現在のユーザー）
  layouts/          UserLayout（利用者側）/ AdminLayout（管理画面側）
  pages/user/       利用者向け画面
  pages/admin/      管理画面
  components/       共通UIコンポーネント（design-system.md参照）
```

## データモデル

| モデル | 主なフィールド | 備考 |
|---|---|---|
| `User` | `employee_number`（ログインID・一意）, `name`, `role`（member/admin）, `status`（active/inactive）, `is_staff`（Django管理サイト用） | カスタムユーザーモデル。`id`と`employee_number`は別物（社員番号は変更・再入社を考慮して分離）。`is_active`はDBカラムではなく`status == active`を返すプロパティ（Django管理サイト・DRFのTokenAuthenticationが参照するため用意。真実の源は常に`status`一つ） |
| `Area` | `name`, `floor`, `description` | |
| `Space` | `area`（FK）, `name`, `capacity`, `tags`（JSON配列）, `description`, `status`（available/in_use/reserved/closed） | |
| `Reservation` | `space`（FK）, `user`（FK・予約者）, `purpose`, `start_date`, `end_date`, `status`（upcoming/active/ended/cancelled）, `created_at` | 同一スペース内で日付が重複する予約は作成・更新時にエラー（`cancelled`は対象外） |
| `ReservationHistory` | `reservation`（FK）, `user`（FK・操作者）, `action`（created/updated/cancelled）, `created_at` | 予約の作成・編集・キャンセルのたびに自動記録。トレーサビリティ用 |
| `Announcement` | `title`, `body`, `category`, `published_at`, `banner_enabled`, `banner_start_date`, `banner_end_date` | 緊急バナー表示は`banner_enabled`かつ期間内のものが対象。バナー表示期間が重複する組み合わせはエラー |
| `CalendarNote` | `date`（一意）, `holiday_name`, `memo` | 管理画面のカレンダーページで祝日・メモを日付ごとに登録 |
| `FloorMap` | `image`（ファイル）, `updated_at` | 常に1件のみ運用（フロアマップ画像はDB経由で全ユーザーに共有配信） |

## 認証・権限

- **ログイン方式**: 社員番号のみでログイン。ただし`role='admin'`のユーザーは社員番号＋パスワードが必須（`core/auth_backends.py`の`IDBackend`）。パスワードなしユーザーのログインAPIは、Djangoの`authenticate()`ディスパッチャ経由だと`ModelBackend`にフォールバックしてしまうため、必ず`IDBackend`を直接呼ぶ実装にしている（`views.py`のコメント参照）。
- **トークン認証**: ログイン成功時にDRFの`Token`を発行し、以降`Authorization: Token <token>`ヘッダーで認証。
- **権限クラス**（`core/permissions.py`）:
  - `IsAdminRoleOrReadOnly`: 閲覧はログイン済みなら誰でも可、作成・編集・削除は`role='admin'`のみ。Area/Space/User/Announcement/CalendarNoteに適用。
  - `IsOwnerOrAdmin`: 閲覧はログイン済みなら誰でも可、編集・削除は本人（`user`フィールドが一致）または管理者のみ。Reservationに適用。予約作成時、一般メンバーは`user`フィールドを自分以外に指定しても強制的に本人にされる（なりすまし防止）。
- **業務上の管理者ロールとDjangoスーパーユーザーは別概念**。詳細は `setup.md` を参照。`UserViewSet`のqueryset はスーパーユーザーを常に除外している。
- **パスワード変更**: `POST /api/users/<id>/set_password/`（管理者限定）で他ユーザーのパスワードを再設定できる。管理画面の`UserDetail`（対象が`role=admin`の場合のみ）から利用可能。Djangoの`validate_password`でバリデーションする。
- **Django管理サイト**: `core/admin.py`で`django.contrib.auth.admin.UserAdmin`をカスタムユーザーモデル向けに継承（`fieldsets`に`is_active`は含めない。上記プロパティのため実フィールドではなく、`ModelForm`が認識できないためエラーになる）。検索（社員番号/氏名）・絞り込み（role/status/is_staff/is_superuser）・安全なパスワード変更（生のハッシュを直接編集させない）に対応。

## フロントエンドのデータ取得

- モックデータ（`mock/data.ts`）は廃止済み。全ページが`lib/api/resources.ts`経由で実APIを呼ぶ。
- `lib/useAsync.ts`: `{ data, isLoading, error, reload }`を返す薄いフック。各ページはこれを使い、ロード中は該当箇所にスケルトン（`components/Skeleton/`）、エラー時は`ErrorState`（再読み込みボタン付き）を表示する。全画面を覆う形のローディング表示はしない。
- APIエラーメッセージは`lib/api/client.ts`の`ApiError`が、DRFのバリデーションエラー（`non_field_errors`やフィールド単位のエラー）を可能な限りそのまま表示用メッセージに変換する。ページ側は`err instanceof ApiError ? err.message : '（フォールバック文言）'`のパターンで統一。

## CSVインポート/エクスポート（ユーザー）

- `GET /api/users/export_csv/`: 管理者のみ。UTF-8（BOM付き、Excel対策）でCSVダウンロード。
- `POST /api/users/import_csv/`: 管理者のみ。`employee_number`をキーに upsert（既存なら上書き更新、新規なら作成）。不正な行はスキップしエラーメッセージを行番号付きで返す。Djangoスーパーユーザーの社員番号を使った上書きは拒否。
