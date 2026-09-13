import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { FloorMap } from '../../../components/FloorMap/FloorMap';
import { AreaSpaceSection } from '../../../components/AreaSpaceSection/AreaSpaceSection';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { SkeletonCards } from '../../../components/Skeleton/SkeletonCards';
import { useAsync } from '../../../lib/useAsync';
import { listAreas, listReservations, listSpaces } from '../../../lib/api/resources';

export function AreaList() {
  const { data, isLoading, error, reload } = useAsync(
    () => Promise.all([listAreas(), listSpaces(), listReservations()]),
    [],
  );

  return (
    <div>
      <PageHeader title="エリア一覧" description="エリアごとにスペースをまとめて確認できます。" />

      <FloorMap />

      {isLoading ? (
        <SkeletonCards count={6} />
      ) : error || !data ? (
        <ErrorState onRetry={reload} />
      ) : (
        (() => {
          const [areas, spaces, reservations] = data;
          return areas.map((area) => (
            <AreaSpaceSection
              key={area.id}
              area={area}
              spaces={spaces.filter((space) => space.areaId === area.id)}
              reservations={reservations}
            />
          ));
        })()
      )}
    </div>
  );
}
