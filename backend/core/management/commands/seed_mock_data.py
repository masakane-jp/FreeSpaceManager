"""Seed the database with the same data as frontend/src/mock/data.ts.

This is a one-time snapshot transcribed from the mock, for populating a
dev database - it is not kept in sync automatically.
"""
from django.core.management.base import BaseCommand

from core.models import Announcement, Area, CalendarNote, Reservation, Space, User

USERS = [
    {'id': 'u-001', 'employee_number': '10001', 'name': '田中 太郎', 'role': 'admin', 'status': 'active'},
    {'id': 'u-002', 'employee_number': '10002', 'name': '佐藤 花子', 'role': 'member', 'status': 'active'},
    {'id': 'u-003', 'employee_number': '10003', 'name': '鈴木 一郎', 'role': 'admin', 'status': 'active'},
    {'id': 'u-004', 'employee_number': '10004', 'name': '高橋 美咲', 'role': 'member', 'status': 'active'},
    {'id': 'u-005', 'employee_number': '10005', 'name': '伊藤 健太', 'role': 'member', 'status': 'active'},
    {'id': 'u-006', 'employee_number': '10006', 'name': '渡辺 直美', 'role': 'admin', 'status': 'inactive'},
]

AREAS = [
    {'id': 'a-01', 'name': '本社3Fオープンエリア', 'floor': '3F', 'description': '3階の南側にある開放的なフリースペース。窓際で採光が良い。'},
    {'id': 'a-02', 'name': '本社5F会議室ゾーン', 'floor': '5F', 'description': '5階に集約された会議室・個室ブース群。'},
    {'id': 'a-03', 'name': '別館1F多目的スペース', 'floor': '1F', 'description': '別館1階の多目的利用スペース。イベントや研修にも利用可。'},
    {'id': 'a-04', 'name': '本社1Fロビー横スペース', 'floor': '1F', 'description': '来客対応や軽い打ち合わせに利用できるロビー横のスペース。'},
]

SPACES = [
    {'id': 's-001', 'area_id': 'a-01', 'name': 'オープンデスクA', 'capacity': 6, 'tags': ['集中', 'コンセントあり'], 'description': '窓際の6人用オープンデスク。Wi-Fi・電源完備。', 'is_closed': False},
    {'id': 's-002', 'area_id': 'a-01', 'name': 'オープンデスクB', 'capacity': 4, 'tags': ['集中'], 'description': '4人用のコンパクトなデスクスペース。', 'is_closed': False},
    {'id': 's-003', 'area_id': 'a-01', 'name': 'ラウンジソファ席', 'capacity': 3, 'tags': ['リラックス', '雑談'], 'description': 'ソファ席の軽いミーティングスペース。', 'is_closed': False},
    {'id': 's-004', 'area_id': 'a-02', 'name': '会議室501', 'capacity': 8, 'tags': ['プロジェクター', 'ホワイトボード'], 'description': '8名収容の中会議室。プロジェクター常設。', 'is_closed': False},
    {'id': 's-005', 'area_id': 'a-02', 'name': '会議室502', 'capacity': 4, 'tags': ['ホワイトボード'], 'description': '4名収容の小会議室。', 'is_closed': False},
    {'id': 's-006', 'area_id': 'a-02', 'name': '個室ブース503', 'capacity': 1, 'tags': ['Web会議向け', '個室'], 'description': 'Web会議専用の1人用個室ブース。', 'is_closed': False},
    {'id': 's-007', 'area_id': 'a-02', 'name': '個室ブース504', 'capacity': 1, 'tags': ['Web会議向け', '個室'], 'description': 'Web会議専用の1人用個室ブース。', 'is_closed': False},
    {'id': 's-008', 'area_id': 'a-03', 'name': '多目的ホールA', 'capacity': 30, 'tags': ['研修', 'イベント'], 'description': '30名規模の研修・イベント対応ホール。', 'is_closed': False},
    {'id': 's-009', 'area_id': 'a-03', 'name': '多目的ホールB', 'capacity': 15, 'tags': ['研修'], 'description': '15名規模の研修スペース。可動式パーティション。', 'is_closed': True},
    {'id': 's-010', 'area_id': 'a-04', 'name': '応接コーナー1', 'capacity': 4, 'tags': ['来客対応'], 'description': '来客向けの軽い打ち合わせコーナー。', 'is_closed': False},
]

RESERVATIONS = [
    {'id': 'r-001', 'space_id': 's-004', 'user_id': 'u-001', 'purpose': '新機能キックオフMTG', 'start_date': '2026-09-14', 'end_date': '2026-09-14', 'is_cancelled': False, 'created_at': '2026-09-10'},
    {'id': 'r-002', 'space_id': 's-002', 'user_id': 'u-001', 'purpose': '集中作業（開発タスク）', 'start_date': '2026-09-11', 'end_date': '2026-09-13', 'is_cancelled': False, 'created_at': '2026-09-09'},
    {'id': 'r-003', 'space_id': 's-006', 'user_id': 'u-002', 'purpose': '取引先とのWeb会議', 'start_date': '2026-09-12', 'end_date': '2026-09-12', 'is_cancelled': False, 'created_at': '2026-09-08'},
    {'id': 'r-004', 'space_id': 's-004', 'user_id': 'u-005', 'purpose': '週次進捗会議', 'start_date': '2026-09-08', 'end_date': '2026-09-08', 'is_cancelled': False, 'created_at': '2026-09-01'},
    {'id': 'r-005', 'space_id': 's-008', 'user_id': 'u-003', 'purpose': '新入社員研修', 'start_date': '2026-09-20', 'end_date': '2026-09-22', 'is_cancelled': False, 'created_at': '2026-09-05'},
    {'id': 'r-006', 'space_id': 's-001', 'user_id': 'u-004', 'purpose': '資料作成', 'start_date': '2026-09-05', 'end_date': '2026-09-06', 'is_cancelled': False, 'created_at': '2026-09-01'},
    {'id': 'r-007', 'space_id': 's-005', 'user_id': 'u-001', 'purpose': '1on1', 'start_date': '2026-09-16', 'end_date': '2026-09-16', 'is_cancelled': False, 'created_at': '2026-09-11'},
    {'id': 'r-008', 'space_id': 's-010', 'user_id': 'u-002', 'purpose': '来客対応（A社様）', 'start_date': '2026-09-13', 'end_date': '2026-09-13', 'is_cancelled': True, 'created_at': '2026-09-07'},
    {'id': 'r-009', 'space_id': 's-003', 'user_id': 'u-001', 'purpose': 'チームランチ後の雑談MTG', 'start_date': '2026-09-18', 'end_date': '2026-09-18', 'is_cancelled': False, 'created_at': '2026-09-11'},
    {'id': 'r-010', 'space_id': 's-007', 'user_id': 'u-001', 'purpose': '採用面接（Web）', 'start_date': '2026-09-19', 'end_date': '2026-09-19', 'is_cancelled': False, 'created_at': '2026-09-10'},
    {'id': 'r-011', 'space_id': 's-004', 'user_id': 'u-001', 'purpose': '月次レビュー会議', 'start_date': '2026-08-31', 'end_date': '2026-08-31', 'is_cancelled': False, 'created_at': '2026-08-25'},
    {'id': 'r-012', 'space_id': 's-001', 'user_id': 'u-001', 'purpose': '資料作成（集中タイム）', 'start_date': '2026-08-27', 'end_date': '2026-08-28', 'is_cancelled': False, 'created_at': '2026-08-20'},
    {'id': 'r-013', 'space_id': 's-005', 'user_id': 'u-001', 'purpose': 'チーム定例会議', 'start_date': '2026-08-24', 'end_date': '2026-08-24', 'is_cancelled': False, 'created_at': '2026-08-18'},
    {'id': 'r-014', 'space_id': 's-002', 'user_id': 'u-001', 'purpose': '仕様検討ミーティング', 'start_date': '2026-08-20', 'end_date': '2026-08-21', 'is_cancelled': False, 'created_at': '2026-08-15'},
    {'id': 'r-015', 'space_id': 's-006', 'user_id': 'u-001', 'purpose': '海外拠点とのWeb会議', 'start_date': '2026-08-17', 'end_date': '2026-08-17', 'is_cancelled': False, 'created_at': '2026-08-10'},
    {'id': 'r-016', 'space_id': 's-010', 'user_id': 'u-001', 'purpose': '来客対応（協力会社）', 'start_date': '2026-08-13', 'end_date': '2026-08-13', 'is_cancelled': True, 'created_at': '2026-08-05'},
    {'id': 'r-017', 'space_id': 's-003', 'user_id': 'u-001', 'purpose': '振り返りミーティング', 'start_date': '2026-08-07', 'end_date': '2026-08-07', 'is_cancelled': False, 'created_at': '2026-08-01'},
    {'id': 'r-018', 'space_id': 's-007', 'user_id': 'u-001', 'purpose': '1on1（月次）', 'start_date': '2026-08-03', 'end_date': '2026-08-03', 'is_cancelled': False, 'created_at': '2026-07-28'},
    {'id': 'r-019', 'space_id': 's-004', 'user_id': 'u-001', 'purpose': '四半期キックオフMTG', 'start_date': '2026-07-29', 'end_date': '2026-07-29', 'is_cancelled': False, 'created_at': '2026-07-20'},
]

ANNOUNCEMENTS = [
    {'id': 'n-025', 'title': '【緊急】給排水設備トラブルにより会議室501を一時停止しています', 'body': '本日、給排水設備のトラブルが発生したため、会議室501を緊急停止しています。ご予約いただいていた方には別途ご連絡します。復旧までしばらくお待ちください。', 'category': 'メンテナンス', 'published_at': '2026-09-12', 'banner_enabled': True, 'banner_start_date': '2026-09-12', 'banner_end_date': None},
    {'id': 'n-024', 'title': '別館1F多目的ホールBの一時停止について', 'body': '設備点検のため、多目的ホールBを2026年9月20日まで利用停止とします。ご不便をおかけしますが、他のスペースをご利用ください。', 'category': 'メンテナンス', 'published_at': '2026-09-11', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-023', 'title': '秋の全社交流イベントを開催します', 'body': '10月上旬に別館1F多目的ホールAにて全社交流イベントを開催予定です。詳細は追ってご案内します。', 'category': 'イベント', 'published_at': '2026-09-09', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-022', 'title': 'フリースペース予約ルールの一部変更について', 'body': '同一スペースの連続予約は最大5営業日までとするルールを追加しました。詳細はご利用ガイドをご確認ください。', 'category': '運用変更', 'published_at': '2026-09-08', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-021', 'title': '本社5F会議室ゾーンにプロジェクターを増設しました', 'body': '会議室502にプロジェクターを新設しました。予約時にタグ「プロジェクター」で検索できます。', 'category': 'お知らせ', 'published_at': '2026-09-05', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-020', 'title': '台風接近に伴う別館利用に関するお願い', 'body': '台風接近時は別館の利用を控え、本社ビル内のスペースをご利用いただくようお願いします。', 'category': 'お知らせ', 'published_at': '2026-09-03', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-019', 'title': '個室ブースの利用マナーについて', 'body': 'Web会議専用個室ブースにて長時間の私語・休憩利用が増えています。譲り合ってご利用ください。', 'category': '運用変更', 'published_at': '2026-09-01', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-018', 'title': '本社1Fロビー横スペースの清掃強化について', 'body': '来客対応が多いロビー横スペースについて、清掃頻度を1日2回に増やしました。', 'category': 'お知らせ', 'published_at': '2026-08-28', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-017', 'title': '9月の定期メンテナンスのお知らせ', 'body': '9月14日(月) 深夜2時〜4時にシステムメンテナンスを実施します。予約システムが一時利用できなくなります。', 'category': 'メンテナンス', 'published_at': '2026-08-25', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-016', 'title': '新入社員向けフリースペース利用ガイダンスを実施しました', 'body': '新入社員向けにフリースペースの利用方法についてガイダンスを実施しました。資料は社内ポータルに掲載しています。', 'category': 'イベント', 'published_at': '2026-08-22', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-015', 'title': 'ラウンジソファ席の座席数を増席しました', 'body': '本社3Fオープンエリアのラウンジソファ席について、利用者増加に伴い座席を1席増やしました。', 'category': 'お知らせ', 'published_at': '2026-08-20', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-014', 'title': '夏季休業期間中のスペース利用について', 'body': '夏季休業期間中も一部フリースペースは利用可能です。対象スペースは社内ポータルをご確認ください。', 'category': 'お知らせ', 'published_at': '2026-08-15', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-013', 'title': '会議室501の予約枠上限を見直しました', 'body': '会議室501の連続予約上限を3日から5日に変更しました。', 'category': '運用変更', 'published_at': '2026-08-10', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-012', 'title': 'フリースペース利用状況アンケートのお願い', 'body': 'サービス改善のため、フリースペースの利用状況に関するアンケートにご協力ください。', 'category': 'お知らせ', 'published_at': '2026-08-05', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-011', 'title': '多目的ホールAの防音工事完了のお知らせ', 'body': '別館1F多目的ホールAの防音工事が完了しました。研修・イベント利用時の音漏れが軽減されます。', 'category': 'メンテナンス', 'published_at': '2026-08-01', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-010', 'title': '応接コーナー1の予約枠を新設しました', 'body': '来客対応向けの応接コーナー1について、30分単位での短時間予約枠を新設しました。', 'category': 'お知らせ', 'published_at': '2026-07-28', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-009', 'title': 'オフィス移転に伴うエリア再編のお知らせ', 'body': '来年度のオフィス移転に向けて、フリースペースのエリア構成を見直す予定です。詳細は決定次第お知らせします。', 'category': '運用変更', 'published_at': '2026-07-20', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-008', 'title': '会議室502の空調設備を更新しました', 'body': '会議室502の空調設備を更新し、快適にご利用いただけるようになりました。', 'category': 'メンテナンス', 'published_at': '2026-07-15', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-007', 'title': '個室ブース504を新設しました', 'body': '本社5F会議室ゾーンに個室ブース504を新設しました。Web会議専用としてご利用ください。', 'category': 'お知らせ', 'published_at': '2026-07-10', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-006', 'title': 'フリースペース管理システムをリリースしました', 'body': 'フリースペースの空き状況確認・予約ができる管理システムをリリースしました。ぜひご活用ください。', 'category': 'お知らせ', 'published_at': '2026-07-01', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-005', 'title': 'ゴールデンウィーク期間中の利用について', 'body': 'ゴールデンウィーク期間中は一部スペースの清掃・点検を行うため利用を制限します。', 'category': 'メンテナンス', 'published_at': '2026-04-25', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-004', 'title': '本社3Fオープンエリアをリニューアルしました', 'body': '本社3Fオープンエリアの什器を刷新し、より快適にご利用いただけるようになりました。', 'category': 'お知らせ', 'published_at': '2026-04-10', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-003', 'title': '新年度のフリースペース利用ルールについて', 'body': '新年度に伴い、フリースペースの利用ルールを一部改定しました。ご確認のうえご利用ください。', 'category': '運用変更', 'published_at': '2026-04-01', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-002', 'title': '別館1F多目的スペースの利用を開始しました', 'body': '別館1階に新設した多目的スペースの利用を開始しました。研修やイベントにご活用ください。', 'category': 'お知らせ', 'published_at': '2026-03-15', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
    {'id': 'n-001', 'title': 'フリースペース管理アプリのサービス開始について', 'body': '社内のフリースペースを一元管理するサービスを開始しました。今後ともよろしくお願いいたします。', 'category': 'お知らせ', 'published_at': '2026-03-01', 'banner_enabled': False, 'banner_start_date': None, 'banner_end_date': None},
]

CALENDAR_NOTES = [
    {'id': 'c-001', 'date': '2026-09-21', 'holiday_name': '敬老の日', 'memo': ''},
    {'id': 'c-002', 'date': '2026-09-22', 'holiday_name': '国民の休日', 'memo': ''},
    {'id': 'c-003', 'date': '2026-09-23', 'holiday_name': '秋分の日', 'memo': ''},
    {'id': 'c-004', 'date': '2026-09-14', 'holiday_name': '', 'memo': '全社会議のため来客対応を控えてください。'},
    {'id': 'c-005', 'date': '2026-09-30', 'holiday_name': '', 'memo': '上期締め。会議室の利用が集中する見込みです。'},
]


class Command(BaseCommand):
    help = 'Seed the database with the same data as frontend/src/mock/data.ts'

    def handle(self, *args, **options):
        user_map = {}
        for row in USERS:
            user, _ = User.objects.update_or_create(
                employee_number=row['employee_number'],
                defaults={'name': row['name'], 'role': row['role'], 'status': row['status']},
            )
            user_map[row['id']] = user
        self.stdout.write(f'Users: {len(user_map)}')

        area_map = {}
        for row in AREAS:
            area, _ = Area.objects.update_or_create(
                name=row['name'],
                defaults={'floor': row['floor'], 'description': row['description']},
            )
            area_map[row['id']] = area
        self.stdout.write(f'Areas: {len(area_map)}')

        space_map = {}
        for row in SPACES:
            space, _ = Space.objects.update_or_create(
                name=row['name'],
                defaults={
                    'area': area_map[row['area_id']],
                    'capacity': row['capacity'],
                    'tags': row['tags'],
                    'description': row['description'],
                    'is_closed': row['is_closed'],
                },
            )
            space_map[row['id']] = space
        self.stdout.write(f'Spaces: {len(space_map)}')

        reservation_count = 0
        for row in RESERVATIONS:
            reservation, _ = Reservation.objects.update_or_create(
                space=space_map[row['space_id']],
                user=user_map[row['user_id']],
                purpose=row['purpose'],
                start_date=row['start_date'],
                defaults={'end_date': row['end_date'], 'is_cancelled': row['is_cancelled']},
            )
            reservation_count += 1
        self.stdout.write(f'Reservations: {reservation_count}')

        announcement_count = 0
        for row in ANNOUNCEMENTS:
            Announcement.objects.update_or_create(
                title=row['title'],
                defaults={
                    'body': row['body'],
                    'category': row['category'],
                    'published_at': row['published_at'],
                    'banner_enabled': row['banner_enabled'],
                    'banner_start_date': row['banner_start_date'],
                    'banner_end_date': row['banner_end_date'],
                },
            )
            announcement_count += 1
        self.stdout.write(f'Announcements: {announcement_count}')

        note_count = 0
        for row in CALENDAR_NOTES:
            CalendarNote.objects.update_or_create(
                date=row['date'],
                defaults={'holiday_name': row['holiday_name'], 'memo': row['memo']},
            )
            note_count += 1
        self.stdout.write(f'Calendar notes: {note_count}')

        self.stdout.write(self.style.SUCCESS('Mock data seeded successfully.'))
