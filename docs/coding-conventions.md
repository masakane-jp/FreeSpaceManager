# 命名規則・フォルダ構成

`design-system.md` がUI/コンポーネントの話なのに対し、こちらはファイル配置・命名などコード全般のルールです。

## フロントエンド（frontend/src）

### コンポーネント・ページのフォルダ構成

1コンポーネント = 1フォルダ。フォルダ名・ファイル名ともにコンポーネント名と同じPascalCaseにする。

```
components/Button/
  Button.tsx
  Button.module.css
```

ページも同様（`pages/user/...` と `pages/admin/...` で利用者側・管理画面側を分離）。

```
pages/admin/UserDetail/
  UserDetail.tsx
  UserDetail.module.css
```

利用者側・管理画面側で同名のページがある場合（例: `SpaceDetail`）、`App.tsx`側で`import { SpaceDetail as AdminSpaceDetail } from '...'`のようにエイリアスする。

### 命名

- **コンポーネント・型・インターフェース**: PascalCase（`Button`, `AppUser`, `ReservationStatus`）
- **変数・関数**: camelCase（`formatDate`, `currentPage`）
- **CSS Modulesのクラス名**: camelCase（`.backLink`, `.dialogActions`）。ケバブケースは使わない
- **APIリソース関数**（`lib/api/resources.ts`）: `list*` / `get*` / `create*` / `update*` / `delete*` の接頭辞で統一（例: `listUsers`, `getUser`, `createUser`, `updateUser`）。CSV等の例外は`exportUsersCsv` / `importUsersCsv`のように動詞を明示
- **状態管理フック**: `useAsync`が返す値は常に `{ data, isLoading, error, reload }` の形

### API層の構造（lib/api/）

- `client.ts`: 素の`fetch`ラッパー（トークン付与・エラー変換のみ）
- `types.ts`: バックエンドのレスポンス形そのまま（snake_case、数値ID） — 型名は`Api`接頭辞（`ApiUser`など）
- `mappers.ts`: `Api*` → フロントの型（`types/index.ts`、camelCase、ID文字列化）への変換関数（`toAppUser`など）
- `resources.ts`: 実際に各ページから呼ぶ関数。内部で`client.ts` + `mappers.ts`を組み合わせる

新しいAPIを追加する際も、この4ファイルの役割分担を崩さないこと（ページ側で直接`fetch`やsnake_caseフィールドを触らない）。

## バックエンド（backend/core）

- Django標準の命名規則に準拠：モデル・クラスはPascalCase、フィールド・関数はsnake_case。
- モデルの`verbose_name`は必ず日本語で指定する（Django管理サイトの表示用。`models.py`参照）。
- 1ファイルに全モデル・全シリアライザ・全ビューを置く方針（`models.py` / `serializers.py` / `views.py` を機能ごとに分割していない）。モデル数が今後大きく増えない限りはこのままでよい。

## コメント・抽象化の方針

- コメントは基本的に書かない。書くのは「なぜ」がコードから読み取れない場合のみ（隠れた制約・バグ回避・非自明な仕様判断）。「何をしているか」の説明コメントは書かない（例: `views.py`の`IDBackend`直接呼び出しの理由コメントは残す価値がある例）。
- 3行程度の重複より、時期尚早な抽象化を避ける。将来使うかもしれない汎用化は行わない（YAGNI）。
- 後方互換のためのシムやフォールバックは作らない。不要になったコードは残さず削除する。
