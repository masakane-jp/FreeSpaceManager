import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { SkeletonTable } from '../../../components/Skeleton/SkeletonTable';
import { Pagination } from '../../../components/Pagination/Pagination';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import {
  createArea,
  createSpace,
  getFloorMap,
  listAreas,
  listSpaces,
  resetFloorMap,
  uploadFloorMap,
} from '../../../lib/api/resources';
import { spaceStatusLabel, spaceStatusTone } from '../../../lib/status';
import defaultFloorMapImage from '../../../assets/floor-map.svg';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './AreaSpaceList.module.css';

const PAGE_SIZE = 10;

type Dialog = { type: 'create-area' } | { type: 'create-space' } | null;

export function AreaSpaceList() {
  const { data, isLoading, error, reload } = useAsync(
    () => Promise.all([listAreas(), listSpaces()]),
    [],
  );
  const {
    data: floorMapData,
    isLoading: isFloorMapLoading,
    reload: reloadFloorMap,
  } = useAsync(() => getFloorMap(), []);

  const [areaPage, setAreaPage] = useState(1);
  const [spacePage, setSpacePage] = useState(1);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [floorMapError, setFloorMapError] = useState<string | null>(null);
  const floorMapInputRef = useRef<HTMLInputElement>(null);

  const [areaForm, setAreaForm] = useState({ name: '', floor: '', description: '' });
  const [spaceForm, setSpaceForm] = useState({
    name: '',
    areaId: '',
    description: '',
    isClosed: false,
  });

  const [areasState, spacesState] = data ?? [[], []];

  const areaTotalPages = Math.max(1, Math.ceil(areasState.length / PAGE_SIZE));
  const areaSafePage = Math.min(areaPage, areaTotalPages);
  const areaPageItems = areasState.slice((areaSafePage - 1) * PAGE_SIZE, areaSafePage * PAGE_SIZE);

  const spaceTotalPages = Math.max(1, Math.ceil(spacesState.length / PAGE_SIZE));
  const spaceSafePage = Math.min(spacePage, spaceTotalPages);
  const spacePageItems = spacesState.slice((spaceSafePage - 1) * PAGE_SIZE, spaceSafePage * PAGE_SIZE);

  function getAreaName(areaId: string): string {
    return areasState.find((area) => area.id === areaId)?.name ?? '-';
  }

  function getSpaceCount(areaId: string): number {
    return spacesState.filter((space) => space.areaId === areaId).length;
  }

  function openCreateArea() {
    setAreaForm({ name: '', floor: '', description: '' });
    setDialogError(null);
    setDialog({ type: 'create-area' });
  }

  async function handleSaveArea(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createArea(areaForm);
      setDialog(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'エリアの追加に失敗しました。');
    }
  }

  function openCreateSpace() {
    setSpaceForm({ name: '', areaId: areasState[0]?.id ?? '', description: '', isClosed: false });
    setDialogError(null);
    setDialog({ type: 'create-space' });
  }

  async function handleSaveSpace(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createSpace({ ...spaceForm, capacity: 4, tags: [] });
      setDialog(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'スペースの追加に失敗しました。');
    }
  }

  async function handleFloorMapFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      await uploadFloorMap(file);
      setFloorMapError(null);
      reloadFloorMap();
    } catch (err) {
      setFloorMapError(err instanceof ApiError ? err.message : '画像のアップロードに失敗しました。');
    }
  }

  async function handleResetFloorMap() {
    try {
      await resetFloorMap();
      setFloorMapError(null);
      reloadFloorMap();
    } catch (err) {
      setFloorMapError(err instanceof ApiError ? err.message : '画像のリセットに失敗しました。');
    }
  }

  return (
    <div>
      <PageHeader
        title="エリア・スペース一覧"
        description="エリアとその配下にあるスペースの登録状況を管理します。編集・削除は各詳細画面から行えます。"
      />

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>フロアマップ画像</h2>
        </div>
        <p className={styles.floorMapHint}>
          利用者向けの「エリア一覧」画面とホーム画面に表示される画像です。
        </p>
        <div className={styles.floorMapEditor}>
          <div className={styles.floorMapPreviewFrame}>
            {isFloorMapLoading ? (
              <Skeleton width="100%" height="100%" />
            ) : (
              <img
                src={floorMapData?.image ?? defaultFloorMapImage}
                alt="フロアマップのプレビュー"
                className={styles.floorMapPreviewImage}
              />
            )}
          </div>
          <div className={styles.floorMapControls}>
            {floorMapError && <p className={styles.floorMapError}>{floorMapError}</p>}
            <div className={styles.floorMapButtons}>
              <Button variant="secondary" type="button" onClick={() => floorMapInputRef.current?.click()}>
                画像を選択
              </Button>
              <Button variant="ghost" type="button" onClick={handleResetFloorMap}>
                元の画像に戻す
              </Button>
            </div>
            <input
              ref={floorMapInputRef}
              type="file"
              accept="image/*"
              onChange={handleFloorMapFileChange}
              className={styles.hiddenFileInput}
            />
          </div>
        </div>
      </Card>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>エリア一覧</h2>
          <Button variant="secondary" onClick={openCreateArea}>
            <Plus size={14} /> エリアを追加
          </Button>
        </div>
        {isLoading ? (
          <SkeletonTable columns={3} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <>
            <div className={tableStyles.tableWrap}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>エリア名</th>
                    <th>フロア</th>
                    <th>スペース数</th>
                  </tr>
                </thead>
                <tbody>
                  {areaPageItems.map((area) => (
                    <tr key={area.id}>
                      <td className={styles.nameCell}>
                        <Link to={`/admin/areas/${area.id}`}>{area.name}</Link>
                      </td>
                      <td>{area.floor}</td>
                      <td>{getSpaceCount(area.id)}件</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={areaSafePage} totalPages={areaTotalPages} onPageChange={setAreaPage} />
          </>
        )}
      </Card>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>スペース一覧</h2>
          <Button variant="secondary" onClick={openCreateSpace}>
            <Plus size={14} /> スペースを追加
          </Button>
        </div>
        {isLoading ? (
          <SkeletonTable columns={3} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <>
            <div className={tableStyles.tableWrap}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>スペース名</th>
                    <th>エリア</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {spacePageItems.map((space) => (
                    <tr key={space.id}>
                      <td className={styles.nameCell}>
                        <Link to={`/admin/spaces/${space.id}`}>{space.name}</Link>
                      </td>
                      <td>{getAreaName(space.areaId)}</td>
                      <td>
                        <Badge tone={spaceStatusTone[space.status]}>{spaceStatusLabel[space.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={spaceSafePage} totalPages={spaceTotalPages} onPageChange={setSpacePage} />
          </>
        )}
      </Card>

      {dialog?.type === 'create-area' && (
        <Modal title="エリアを追加" onClose={() => setDialog(null)}>
          <form className={styles.form} onSubmit={handleSaveArea}>
            {dialogError && <FormError message={dialogError} />}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>エリア名</span>
              <input
                type="text"
                className={styles.input}
                value={areaForm.name}
                onChange={(event) => setAreaForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>フロア</span>
              <input
                type="text"
                className={styles.input}
                value={areaForm.floor}
                onChange={(event) => setAreaForm((prev) => ({ ...prev, floor: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>説明</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={areaForm.description}
                onChange={(event) => setAreaForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <div className={styles.dialogActions}>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                閉じる
              </Button>
              <Button type="submit">保存する</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog?.type === 'create-space' && (
        <Modal title="スペースを追加" onClose={() => setDialog(null)}>
          <form className={styles.form} onSubmit={handleSaveSpace}>
            {dialogError && <FormError message={dialogError} />}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>スペース名</span>
              <input
                type="text"
                className={styles.input}
                value={spaceForm.name}
                onChange={(event) => setSpaceForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>エリア</span>
              <select
                className={styles.input}
                value={spaceForm.areaId}
                onChange={(event) => setSpaceForm((prev) => ({ ...prev, areaId: event.target.value }))}
                required
              >
                {areasState.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={spaceForm.isClosed}
                onChange={(event) =>
                  setSpaceForm((prev) => ({ ...prev, isClosed: event.target.checked }))
                }
              />
              利用を停止する
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>説明</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={spaceForm.description}
                onChange={(event) => setSpaceForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <div className={styles.dialogActions}>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                閉じる
              </Button>
              <Button type="submit">保存する</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
