# セットアップ手順

このリポジトリは `frontend/`（React + Vite + TypeScript）と `backend/`（Django + DRF）の2プロジェクトで構成されています。開発時は両方を同時に起動する必要があります。

## 前提

- Node.js（frontend用）
- Python 3.12（backend用。Windowsでは `py` ランチャーが使えます）

## バックエンド（Django）

```bash
cd backend
py -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt

# 初回のみ
venv\Scripts\python.exe manage.py migrate
venv\Scripts\python.exe manage.py seed_mock_data   # モックデータ投入（何度実行しても重複しない）

# 起動（フロントエンドのdevサーバーは5174番なので、8000番で固定）
venv\Scripts\python.exe manage.py runserver 8000
```

`http://localhost:8000/api/` にAPIが立ち上がります。`http://localhost:8000/admin/` はDjango標準の管理サイトです（後述の「2種類の管理者」を参照）。

アップロード画像（フロアマップ）は `backend/media/` に保存されます（gitignore対象）。

### 環境変数（本番運用時のみ必須）

ローカル開発ではデフォルト値のまま動作します。実際にデプロイする場合は以下を環境変数で設定してください（未設定時はローカル開発用のフォールバック値が使われます）。

| 環境変数 | 内容 | ローカル開発時のデフォルト |
|---|---|---|
| `DJANGO_SECRET_KEY` | Djangoの署名キー | リポジトリ同梱の開発用キー（本番では必ず変更） |
| `DJANGO_DEBUG` | デバッグモード（`True`/`False`） | `True` |
| `DJANGO_ALLOWED_HOSTS` | 許可ホスト名（カンマ区切り） | 空（`DEBUG=True`のため未指定でも動作） |

## フロントエンド（React）

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5174/` で起動します。APIの向き先は `frontend/.env` の `VITE_API_BASE_URL`（デフォルト `http://localhost:8000/api`）。

### 本番ビルド（IISでbackendと同一オリジン配信する構成）

会社のIIS環境ではDjango(backend)がフロントエンドの静的ファイルも配信する構成のため、`npm run build`（`tsc -b && vite build && node scripts/copy-to-backend.mjs`）を実行すると、ビルド出力が自動で以下に配置されます。

- `backend/templates/index.html`
- `backend/static/react/assets/js/`・`backend/static/react/assets/css/`（JSとCSSを分けて配置）
- `backend/static/react/`直下（`favicon.svg`など`public/`由来のファイル）

いずれも`.gitignore`済みの生成物です。Django側は`config/urls.py`の末尾に`api/`・`admin/`・`static/`・`media/`以外の全パスを`index.html`にフォールバックさせるcatch-allルートを用意しており、これによりReact Router（`BrowserRouter`）のURLをリロードしても404にならず正しく動作します。

**注意**: IISのweb.config側の実際の静的配信パス規則がまだ確定していないため、`vite.config.ts`の`base: '/static/react/'`と本番用の`frontend/.env.production`の`VITE_API_BASE_URL=/api`は仮の値です。実際のパス構成が決まったら合わせて調整してください。

ビルド確認のみしたい場合は `npm run build` を実行するだけでOKです（`tsc -b && vite build`のみ実行したい場合はコマンドを個別に叩いてください）。

## ログインアカウント

社員番号のみでログインできます（一般メンバーはパスワード不要、管理者ロールはパスワード必須）。`seed_mock_data` 実行後は以下が使えます。

| 社員番号 | 氏名 | 権限 | 備考 |
|---|---|---|---|
| 10001 | 田中 太郎 | 管理者 | パスワード: `admin1234`（要・手動設定。下記参照） |
| 10002 | 佐藤 花子 | 一般メンバー | パスワード不要 |
| 10003 | 鈴木 一郎 | 管理者 | パスワード: `admin1234`（要・手動設定） |
| 10006 | 渡辺 直美 | 一般メンバー | 退職済み（ログイン不可のデモ用） |

`seed_mock_data` はパスワードを設定しないため、管理者ロールのユーザーは初回のみ以下でパスワードを設定してください。

```bash
venv\Scripts\python.exe manage.py shell -c "
from core.models import User
for u in User.objects.filter(role='admin'):
    u.set_password('admin1234')
    u.save()
"
```

## テスト

### バックエンド（Django）

Djangoの標準テストランナーを使用します。実行時は一時的なテスト用DB（インメモリSQLite）が自動作成されるため、開発用の `db.sqlite3` には影響しません。

```bash
cd backend
venv\Scripts\python.exe manage.py test core
```

テストコードは `backend/core/tests/` 配下に機能ごとにファイルを分けて配置しています。

| ファイル | 内容 |
|---|---|
| `base.py` | 全テスト共通のセットアップ（管理者/一般ユーザー/エリア/スペースの作成ヘルパー） |
| `test_auth.py` | ログイン（パスワード要否、無効化ユーザーの拒否など） |
| `test_permissions.py` | ロール・所有者に基づく権限判定、なりすまし防止 |
| `test_reservations.py` | 予約の日程重複バリデーション、予約履歴の記録 |
| `test_announcements.py` | お知らせバナー表示期間の重複バリデーション |
| `test_csv.py` | ユーザーCSVインポート/エクスポート |

### フロントエンド（Vitest）

```bash
cd frontend
npm run test
```

`vitest run` のエイリアスです。DOM APIが必要なテスト（`localStorage`など）のために `vite.config.ts` で `environment: 'jsdom'` を指定しています。対象は現状、コンポーネント描画を伴わない純粋なロジック（日付処理・APIレスポンスのマッピング・エラーメッセージ抽出）のみです。`@testing-library/react` 等は未導入で、コンポーネントの描画テストは範囲外としています。

| ファイル | 内容 |
|---|---|
| `src/lib/date.test.ts` | 日付フォーマット、ISO⇔Dateの相互変換（ローカル時刻での解釈）、カレンダー週の生成 |
| `src/lib/api/mappers.test.ts` | APIレスポンス（snake_case）→ アプリ内の型（camelCase）への変換 |
| `src/lib/api/client.test.ts` | APIエラー時のメッセージ抽出ロジック、Authorizationヘッダーの付与 |

## 2種類の「管理者」

このアプリには性質の異なる2種類の管理者が存在します。混同しないよう注意してください。

1. **業務上の管理者ロール**（`User.role == 'admin'`）：Reactアプリの管理画面（`/admin/*`）にログインできる、業務上の権限。社員番号＋パスワードでアプリの`/login`からログインします。
2. **Djangoスーパーユーザー**（`is_superuser=True`）：Django標準の管理サイト（`/admin/`、Reactアプリとは別物）にログインするための、開発・保守用アカウント。アプリの`/login`からは（パスワードが合っていても）ログインできず、`/admin/login/`専用です。逆に業務上の管理者ロールのユーザーは`is_staff=False`なのでDjango管理サイトには入れません。またAPI (`/api/users/`) からもこのアカウントは常に除外されます。

開発用のDjangoスーパーユーザーを作る場合：

```bash
venv\Scripts\python.exe manage.py shell -c "
from core.models import User
u = User.objects.create_superuser(employee_number='django-admin', name='Django Admin', password='<好きなパスワード>')
u.status = User.Status.INACTIVE  # アプリ側の/loginから使われないように
u.save()
"
```
