/* 이야기: 장 → 장면 → 걷다가 만나는 행위 지점 → 벌어지는 일
   단계 표기
   ['t', 큰제목, 작은제목]  ['n', 해설]  ['me', 속말]  ['s', 누구, 표정, 대사]
   ['card', 글카드]  ['exp', 경험카드]  ['quiz', 문항]  ['concept', 배운것]
   ['ask', 물음, [보기], 정답번호, 맞았을때말]  ['go', 장면]  ['end']  ['ending']
   모든 인물과 대사는 창작입니다. 실존 인물은 등장하지 않습니다. */
(function () {
  'use strict';
  const S = {};

  // ══════════════════ 서장 ══════════════════
  S.p = { title: '서장 · 독감의 가을', date: '1918년 가을', place: '경성 종로', bgm: 'bgm_autumn_walk', start: 'p1', scenes: {
    p1: { type: 'room', length: 5.2, room: { wall: 'int_jimulpo_back_AUT', floor: 'tile_floor_maru' },
      enter: [['t', '서장 · 독감의 가을', '1918년 가을, 경성 종로'],
        ['n', '우리 집은 종이와 붓을 파는 지물포다. 나는 열두 살, 보통학교 4학년이다.'],
        ['s', 'hg', 'worry', '콜록… 아버지, 학교 다녀오겠습니다.'],
        ['me', '{hg|은는} 아침부터 기침을 한다. 그런데 아프다는 말은 하지 않는다.'],
        ['s', 'father', 'neutral', '{name|아야}, 어머니 약이 떨어졌구나. 골목 끝 약방에 다녀오너라.'],
        ['s', 'father', 'worry', '요즘 독감이 돈다더라. 사람 많은 데는 피해서 다니고.'],
        ['s', 'father', 'neutral', '참, 나가기 전에 이리 와서 달력 한 장만 넘겨 다오. 벌써 달이 바뀌었구나.'],
        ['help', 'walk']],
      nodes: [
        { id: 'calendar', d: 2.6, x: -1.5, who: 'father', whoX: -2.5, whoD: 0.4, required: true, order: 1, label: '아버지 곁에서 달력을 넘긴다', goal: '달력',
          ev: [['n', '기둥에 걸린 달력을 한 장 넘겼다. 맨 위에 큰 글자로 「大正七年」이라고 쓰여 있다.'], ['me', '「아버지, 이건 뭐라고 읽어요?」'],
            ['s', 'father', 'neutral', '「다이쇼 칠 년」이라고 읽는다. 일본 임금이 자리에 오른 해부터 센 햇수다. 관청에서 내는 글도, 신문도 다 이 햇수를 쓴다.'],
            ['me', '서기로는 1918년이다. 같은 해인데 부르는 이름이 여러 가지다.'], ['exp', 'taisho']],
          mem: [['n', '가게 달력 맨 위에는 「大正七年」이라고 쓰여 있었다.'], ['s', 'father', 'neutral', '「다이쇼 칠 년」이라고 읽는다. 일본 임금이 자리에 오른 해부터 센 햇수다. 관청에서 내는 글도, 신문도 다 이 햇수를 쓴다.']] },
        { id: 'door', d: 5.2, x: 0, stop: 1.0, required: true, order: 2, label: '심부름을 나선다', goal: '가게 문', ev: [['go', 'p2']] }] },

    p2: { type: 'street', season: 'AUT', sky: 'bg_far_day_AUT', ground: 'tile_ground_dirt_AUT', length: 58, startD: 3, end: { img: 'fac_pharmacy' },
      left: ['fac_shop_a_open', { img: 'fac_board_wall', id: 'board' }, 'fac_gate_house', 'fac_shop_b_open', 'fac_wall_tile'],
      right: ['fac_jimulpo_open', 'fac_shop_b_open', 'fac_gate_house', { img: 'fac_wall_tile', id: 'school' }, 'fac_shop_a_open'],
      sprites: [{ img: 'near_onggi', x: -4.7, d: 5, h: 1.25 }, { img: 'near_wood_bench', x: 4.4, d: 12.5, h: 0.55 }, { img: 'near_cart', x: -4.3, d: 30, h: 1.5 },
        { img: 'near_lamp_post', x: -4.9, d: 36, h: 5.2 }, { img: 'world_teacher_back', x: 1.7, d: 43, h: 1.78 }, { img: 'near_jige', x: 4.9, d: 52, h: 1.5 }],
      enter: [['n', '약방은 이 골목 끝에 있다. 가는 길에 빛나는 것이 보이면 가까이 가서 살펴볼 수 있다.'], ['help', 'act']],
      nodes: [
        { id: 'news', d: 12.5, side: 'R', x: 4.0, prop: 'prop_newspaper_folded', propY: 0.45, label: '평상 위 신문을 본다', ev: [['card', 'mn_1017'], ['me', '신문에는 기사 제목만 크게 보인다. 제목만 읽어도 무슨 일인지 짐작이 간다.']] },
        { id: 'board', at: 'board', side: 'L', required: true, label: '벽보판의 신문을 본다', goal: '벽보판',
          ev: [['n', '사람들이 벽보판 앞에 모여 신문을 읽고 있다.'], ['card', 'mn_1019'], ['card', 'mn_1031'], ['exp', 'flu_autumn'], ['me', '우리 반에도 빈자리가 많다. {hg|은는} 괜찮은 걸까.']],
          mem: [['n', '지난가을, 벽보판 앞.'], ['card', 'mn_1019'], ['card', 'mn_1031']] },
        { id: 'neighbors', d: 22, x: -2.4, who: 'npc_ajumma', sil: 'woman', whoX: -3.5, whoD: 0.2, required: true, label: '길가에서 이웃 아주머니를 만난다', goal: '이웃 아주머니',
          ev: [['s', '이웃 아주머니', null, '지물포 집 아이로구나. 너도 약방에 가는 길이냐?'],
            ['s', '이웃 아주머니', null, '건넛집은 식구가 다 누웠다더라. 약 지으러 갈 사람도 없어서 내가 대신 다녀왔지.'],
            ['s', '이웃 아주머니', null, '쌀값이 몇 해 사이에 몇 곱절이 뛰었는데 약값까지 드니, 원.'],
            ['me', '앓는 집이 우리 집만이 아니다.'], ['exp', 'neighbors_flu']],
          mem: [['s', '이웃 아주머니', null, '건넛집은 식구가 다 누웠다더라. 약 지으러 갈 사람도 없어서 내가 대신 다녀왔지.']] },
        { id: 'map', d: 36, side: 'L', x: -3.4, label: '갈림길에서 길을 살핀다', markY: 1.6,
          ev: [['me', '갈림길이다. 한쪽은 큰길로 나가는 길, 다른 쪽은 약방이 있는 골목 끝이다. 큰길 쪽으로는 아직 혼자 가 본 적이 없다. 그쪽에서 전차 종소리가 들려온다.']] },
        { id: 'teacher', d: 43, x: 1.7, required: true, goal: '선생님', label: '선생님께 인사한다', markY: 2.0,
          ev: [['n', '우리 학교 선생님이다. 제복을 입고, 허리에는 칼을 찼다.'], ['me', '「안녕하십니까.」 선생님은 고개만 끄덕이고 지나가셨다. 칼집이 걸음마다 흔들렸다.'], ['exp', 'teacher_sword']],
          mem: [['n', '선생님은 제복을 입고 허리에 칼을 찼다.']] },
        { id: 'timetable', at: 'school', side: 'R', required: true, goal: '학교 담장', prop: 'prop_timetable_board', mount: true, propY: 0.95, propH: 0.8, label: '학교 담장에 걸린 시간표를 본다',
          ev: [['n', '보통학교 담장이다. 교실에 붙은 것과 같은 시간표가 걸려 있다.'], ['card', 'timetable'], ['me', '「국어」 시간이 제일 많다. 그런데 「국어」는 일본말이다. 우리말은 「조선어」라고 부른다.'], ['exp', 'timetable']],
          mem: [['card', 'timetable'], ['me', '「국어」는 일본말이고, 우리말은 「조선어」라고 불렀다.']] },
        { id: 'pharm', at: 'END', required: true, label: '약방 문을 연다', goal: '약방',
          ev: [['s', '약방 주인', null, '어서 오너라. 지물포 집 아이로구나. 어머니가 편찮으시다고?'],
            ['s', '약방 주인', null, '요새는 약 지으러 오는 사람이 줄을 선다. 오늘 아침에는 인사동에서까지 사람이 왔더구나. 너희 학교는 괜찮으냐?'],
            ['me', '「우리 반에도 빈자리가 많아요. …그런데 인사동이 어디예요?」'],
            ['s', '약방 주인', null, '너희 가게에서 큰길로 나가면 탑골공원이 있지? 바로 그 옆 동네가 인사동이다. 걸어서도 금방이야.'],
            ['n', '약방 주인은 약 싸는 종이 귀퉁이에 붓으로 길을 쓱쓱 그려 보였다.'], ['pic', 'jongno'], ['exp', 'jongno_map'],
            ['me', '약 세 첩을 받아 들었다.'],
            ['s', '약방 주인', null, '독감에 무엇이 좋다는 둥 별별 소문이 다 돈다만, 제 눈으로 보았다는 사람은 하나도 없더구나. 소문은 누가 직접 보았는지부터 물어야 한다.'], ['exp', 'rumor_lesson'], ['go', 'p3']],
          mem: [['s', '약방 주인', null, '너희 가게에서 큰길로 나가면 탑골공원이 있지? 바로 그 옆 동네가 인사동이다. 걸어서도 금방이야.'], ['pic', 'jongno'],
            ['s', '약방 주인', null, '별별 소문이 다 돈다만, 제 눈으로 보았다는 사람은 하나도 없더구나. 소문은 누가 직접 보았는지부터 물어야 한다.']] }
      ] },

    p3: { type: 'room', length: 5, room: { wall: 'int_maru_back_WIN', floor: 'tile_floor_maru' },
      enter: [['n', '집에 돌아왔다. 어머니는 안방에 누워 계신다.']],
      nodes: [{ id: 'granny', d: 2.4, side: 'R', furn: 'chest', who: 'grandma', whoX: 2.5, whoD: 0.5, order: 1, required: true, label: '장롱을 정리하시는 할머니께 간다', goal: '할머니',
        ev: [['s', 'grandma', 'neutral', '{name|아야}, 왔느냐. 장롱을 정리하던 참이다.'],
          ['s', 'grandma', 'neutral', '맨 밑에 든 이것이 흰 갓이다. 나라에 큰 상이 났을 때, 임금님이 돌아가셨을 때 백성이 쓰는 갓이지. 다시 꺼낼 일이 없으면 좋으련만.'], ['exp', 'white_gat'],
          ['me', '「임금님이요? 지금도 임금님이 계세요?」'],
          ['s', 'grandma', 'sad', '덕수궁에 계신다. 요새는 「이태왕 전하」라 부르라지만, 내게는 여전히 황제 폐하시다. 나라를 빼앗고 나서 그렇게 낮추어 부르게 한 것이다.'], ['exp', 'lost_king']],
        mem: [['s', 'grandma', 'neutral', '흰 갓은 나라에 큰 상이 났을 때, 임금님이 돌아가셨을 때 백성이 쓰는 갓이다.'], ['s', 'grandma', 'sad', '요새는 「이태왕 전하」라 부르라지만, 내게는 여전히 황제 폐하시다.']] },
        { id: 'mom', d: 4.6, x: 0.6, who: 'mother_sick', order: 2, required: true, label: '어머니께 약을 드린다', goal: '어머니',
        ev: [['s', 'mother_sick', 'neutral', '약 지어 왔구나. 고맙다, {name|아야}.'],
          ['s', 'mother_sick', 'worry', '한결이는 아직 안 왔니? 그 애가 기침을 숨기는 걸 내가 모를 줄 알고…'],
          ['me', '어머니는 누워서도 다 아신다. 보지 않고도 아는 것. 그것도 짐작일까.'],
          ['quiz', 'q_p_infer'], ['concept', 'infer'],
          ['n', '11월이 되자 신문은 독감이 그쳤다고 썼다. 어머니는 자리에서 일어나셨고, {hg}의 기침도 멎었다.'], ['card', 'mn_1118'], ['end']] }] }
  } };

  // ══════════════════ 1장 ══════════════════
  S.c1 = { title: '1장 · 흰 갓의 겨울', date: '1919년 1월', place: '경성 종로', bgm: 'bgm_winter_mourning', start: 'c1a', scenes: {
    c1a: { type: 'room', length: 7.2, room: { wall: 'int_maru_back_WIN', floor: 'tile_floor_maru' },
      enter: [['t', '1장 · 흰 갓의 겨울', '1919년 1월 22일 아침'], ['n', '지난 이야기 — 지난가을 독감이 돌았다. 약방 심부름 길에 벽보판의 신문을 읽었고, 할머니는 장롱 속 흰 갓을 보여 주셨다.'],
        ['s', 'father', 'worry', '어제 저녁까지만 해도 덕수궁 전하의 병환이 위중하시다는 말뿐이었는데….'], ['exp', 'news_overnight'],
        ['s', 'father', 'worry', '…오늘 신문이 이상하구나. {name|아야}, 이리 와서 같이 보자.'],
        ['s', 'father', 'neutral', '『매일신보』는 총독부에서 내는 신문이다. 그래도 조선말 신문은 지금 이것 하나뿐이니 볼 수밖에.'], ['exp', 'gov_paper'],
        ['s', 'father', 'neutral', '오늘은 신문 말고도 한 장짜리 종이가 따로 왔구나. 급한 소식이 생기면 신문사에서 이렇게 한 장만 따로 찍어 돌리기도 한다.'], ['exp', 'extra_sheet']],
      nodes: [
        { id: 'paper', d: 3.2, x: -1.1, prop: 'prop_newspaper_open', on: 'desk', who: 'father', whoFace: 'worry', order: 1, required: true, label: '신문을 펼친다', goal: '아버지와 신문',
          ev: [['n', '먼저 네 면짜리 신문의 2면을 펼쳤다.'], ['card', 'mn_0122_2'], ['n', '다음은 따로 온 한 장짜리 종이다.'], ['card', 'mn_0122_1'], ['me', '같은 날, 같은 신문사에서 나온 것인데 두 말이 서로 맞지 않는다.'], ['quiz', 'q1_two'],
            ['s', 'grandma', 'sad', '…기어이 가셨구나.'], ['s', 'grandma', 'neutral', '{name|아야}, 장롱에서 흰 옷을 꺼내 다오. 네 아버지 흰 갓도.'],
            ['me', '할머니는 까닭을 말씀하지 않으셨다.']] },
        { id: 'white', d: 2.4, side: 'R', furn: 'chest', order: 2, required: true, label: '장롱에서 흰 옷과 흰 갓을 꺼낸다', goal: '장롱',
          ev: [['n', '장롱 깊은 곳에서 흰 옷과 흰 갓을 꺼냈다. 할머니는 말없이 옷을 쓰다듬으셨다.'], ['exp', 'white_mourning'], ['go', 'c1b']],
          mem: [['n', '할머니는 까닭을 말하지 않고 흰 옷과 흰 갓을 꺼내게 하셨다.']] }
      ] },
    c1b: { type: 'street', season: 'WIN', sky: 'bg_far_day_WIN', ground: 'tile_ground_snow_WIN', length: 50, startD: 3, end: { img: 'fac_gate_house', w: 10 },
      left: ['fac_shop_a_closed', { img: 'fac_board_wall', id: 'board' }, 'fac_shop_b_closed', 'fac_wall_tile', 'fac_shop_a_closed'],
      right: ['fac_jimulpo_closed', 'fac_shop_b_closed', 'fac_gate_house', 'fac_shop_a_closed', 'fac_wall_tile'],
      sprites: [{ img: 'near_onggi', x: -4.7, d: 6, h: 1.25 }, { img: 'near_lamp_post', x: 4.9, d: 30, h: 5.2 }, { img: 'near_cart', x: 4.3, d: 40, h: 1.5 }],
      crowds: [{ img: 'crowd_passersby', side: 'far', d: 47, w: 9, x: -1 }],
      enter: [['n', '다음 날, 1월 23일. 눈 덮인 종로가 조용하다.'], ['s', 'father', 'neutral', '오늘은 우리도 문을 닫는다. 장사할 날이 아니다.']],
      nodes: [
        { id: 'neighbor', d: 7.5, x: 2.4, who: 'npc_shopman', sil: 'man3', whoX: 3.6, whoD: 0.2, required: true, label: '문을 닫는 이웃 아저씨께 인사한다', goal: '이웃 가게',
          ev: [['s', '이웃 가게 아저씨', null, '지물포 집 아이로구나. 우리도 오늘은 문을 닫는다.'], ['me', '「누가 닫으라고 했어요?」'],
            ['s', '이웃 가게 아저씨', null, '시키긴 누가 시켜. 임금님이 가셨는데 물건을 팔고 앉았을 수야 있나. 다들 제 마음으로 닫은 게지.'], ['exp', 'neighbor_closing']],
          mem: [['n', '1월 23일, 이웃 가게 아저씨도 문을 닫고 있었다.'], ['s', '이웃 가게 아저씨', null, '시키긴 누가 시켜. 임금님이 가셨는데 물건을 팔고 앉았을 수야 있나. 다들 제 마음으로 닫은 게지.']] },
        { id: 'board', at: 'board', side: 'L', required: true, label: '벽보판의 신문을 본다', goal: '벽보판',
          ev: [['card', 'mn_0123_1'], ['card', 'mn_0123_3'], ['me', '우리 가게만이 아니다. 종로 가게가 다 닫혀 있다. 누가 시킨 것도 아닌데.'], ['exp', 'mourn_closing'], ['quiz', 'q1_why']],
          mem: [['n', '1월 23일, 종로 가게들이 스스로 문을 닫았다.'], ['card', 'mn_0123_3']] },
        { id: 'mourners', d: 30, x: -1.6, who: 'npc_mourners', sil: 'pair', silTint: [1.48, 1.7, 1.86], whoX: -2.6, whoD: 0.3, required: true, label: '흰 옷 입은 어른들을 본다', goal: '흰 옷 입은 어른들',
          ev: [['n', '흰 두루마기에 흰 갓을 쓴 어른 둘이 큰길 쪽으로 걸어간다.'], ['me', '「어디 가세요?」'],
            ['s', '흰 옷 입은 어른', null, '덕수궁 문 앞으로 간다. 엎드려 우는 사람이 끝이 없다더구나. 우리도 가서 절을 올려야지.'],
            ['me', '신문 제목의 「궁궐 문 앞에서 소리 내어 욺」이 바로 저 말이다. 지난가을 할머니가 보여 주신 것도 저런 흰 갓이었다.'], ['exp', 'palace_wailing']],
          mem: [['n', '흰 두루마기에 흰 갓을 쓴 어른들이 덕수궁 쪽으로 걸어갔다.'], ['s', '흰 옷 입은 어른', null, '덕수궁 문 앞으로 간다. 엎드려 우는 사람이 끝이 없다더구나. 우리도 가서 절을 올려야지.']] },
        { id: 'granny', at: 'END', who: 'grandma', whoFace: 'worry', whoD: 0.6, required: true, label: '골목 어귀에서 할머니를 기다린다', goal: '골목 어귀',
          ev: [['s', 'grandma', 'worry', '{name|아야}. 밖에서 들은 말이 있다. 임금님이… 병으로 돌아가신 게 아니라, 누가 독을 써서 돌아가시게 했다는구나.'],
            ['s', 'grandma', 'worry', '우물가에서도, 장터에서도 다들 그 말을 한다.'], ['exp', 'rumor_king'], ['quiz', 'q1_rumor'],
            ['s', 'grandma', 'sad', '…모를 일이다. 모르는 것은 모른다고 해 두자꾸나.'], ['exp', 'grandma_unknown'], ['go', 'c1c']],
          mem: [['s', 'grandma', 'worry', '밖에서 들은 말이 있다. 임금님이… 병으로 돌아가신 게 아니라, 누가 독을 써서 돌아가시게 했다는구나.'], ['s', 'grandma', 'worry', '우물가에서도, 장터에서도 다들 그 말을 한다.'],
            ['s', 'grandma', 'sad', '…모를 일이다. 모르는 것은 모른다고 해 두자꾸나.']] }
      ] },
    c1c: { type: 'room', night: true, length: 5, room: { wall: 'int_room_hangyeol_night', floor: 'tile_floor_jangpan' },
      enter: [['n', '그날 밤. {hg}의 방에 등잔불이 켜져 있다. 책상 위에는 방금 쓴 일기가 펼쳐져 있다.'], ['s', 'hg', 'neutral', '아직 안 잤니.'],
        ['me', '{hg}, 저거 일기야? …나도 봐도 돼?'], ['s', 'hg', 'smile', '…그래. 숨길 것도 없지. 이리 와서 봐.']],
      nodes: [{ id: 'diary', d: 4.2, x: 1.0, prop: 'prop_letter_open', on: 'desk', who: 'hg', whoX: -1.2, required: true, label: '{hg}의 일기를 읽는다', goal: '책상',
        ev: [['card', 'hg_diary1'], ['quiz', 'q1_diary'], ['s', 'hg', 'smile', '뭘 그렇게 열심히 읽니, 부끄럽게.'], ['s', 'hg', 'neutral', '…그래도, 글에는 다 쓰지 못하는 말도 있으니 읽어 주는 사람이 있어 좋을 때도 있어.'],
          ['concept', 'clue'], ['n', '며칠 뒤 신문은 장례를 나라의 장례로 치른다고 알렸다. 훗날 장례 날은 3월 3일로 정해졌다.'], ['card', 'mn_0126'], ['end']] }] }
  } };

  // ══════════════════ 2장 ══════════════════
  S.c2 = { title: '2장 · 종이 묶음', date: '1919년 2월 28일 ~ 3월 1일', place: '경성 종로', bgm: 'bgm_night_paper', start: 'c2a', scenes: {
    c2a: { type: 'room', night: true, length: 5, room: { wall: 'int_room_hangyeol_night', floor: 'tile_floor_jangpan' },
      enter: [['t', '2장 · 종이 묶음', '1919년 2월 28일 밤'], ['n', '지난 이야기 — 1월에 임금님이 돌아가셨다. 종로 가게들은 제 마음으로 문을 닫았고, 임금님이 독 때문에 돌아가셨다는 소문이 돌았다.'],
        ['s', 'hg', 'neutral', '…{name|아야}. 아직 안 잤어?'],
        ['me', '{hg|이가} 종이 묶음을 두 팔 가득 안고 있다. 우리 가게 종이가 아니다. 글자가 빽빽이 찍혀 있다.'],
        ['me', '맨 윗장의 첫 줄이 눈에 들어왔다. 「吾等은」이라는 글자로 시작한다. 무슨 뜻인지는 모르겠다.'],
        ['me', '{hg}, 그게 다 뭐야? 이 밤에 어디 가?'],
        ['s', 'hg', 'worry', '…학교 동무들한테 전해 줄 것이 있어. 무엇인지는 묻지 마. 너는 모르는 편이 나아.'],
        ['n', '{hg|은는} 발소리를 죽이고 대문을 나섰다. 책상 위에 쪽지 한 장이 남았다.']],
      nodes: [{ id: 'memo', d: 4.2, x: 1.0, prop: 'prop_note_folded', on: 'desk', required: true, label: '책상 위 메모를 본다', goal: '책상',
        ev: [['card', 'hg_memo'], ['exp', 'night_out'], ['me', '무슨 종이인지는 어디에도 쓰여 있지 않다.'], ['go', 'c2b']],
        mem: [['n', '2월 마지막 밤, {hg|은는} 글자가 찍힌 종이 묶음을 안고 나갔다.'], ['card', 'hg_memo']] }] },
    c2b: { type: 'room', length: 7.4, room: { wall: 'int_jimulpo_back_AUT', floor: 'tile_floor_maru' }, bgm: 'bgm_march_street',
      enter: [['n', '3월 1일 아침. 가게 문을 열자마자 이웃 아주머니가 들어선다.']],
      nodes: [
        { id: 'visitor', d: 0.6, x: -2.0, who: 'npc_ajumma', sil: 'basket', whoX: -3.0, whoD: 0.2, required: true, order: 1, label: '가게에 온 이웃 아주머니를 맞는다', goal: '손님',
          ev: [['s', '이웃 아주머니', null, '종이 한 권만 주시오. …그런데 이 댁에도 왔습디까? 오늘 새벽에 우리 집 마당에 글 찍힌 종이가 한 장 떨어져 있더이다.'],
            ['s', 'father', 'worry', '…우리 집에는 아직 아무것도.'],
            ['s', '이웃 아주머니', null, '밤사이 학생들이 집집마다 돌렸답디다. 무슨 글인지, 나는 글을 몰라 읽지를 못했소.'],
            ['me', '밤사이, 학생들이, 집집마다. 어젯밤 {hg|이가} 안고 나간 종이 묶음이 떠올랐다.'], ['exp', 'door_to_door'],
            ['s', 'father', 'neutral', '…{name|아야}, 선반의 종이나 세자꾸나.']],
          mem: [['s', '이웃 아주머니', null, '오늘 새벽에 우리 집 마당에 글 찍힌 종이가 한 장 떨어져 있더이다. 밤사이 학생들이 집집마다 돌렸답디다. 무슨 글인지, 나는 글을 몰라 읽지를 못했소.']] },
        { id: 'count', d: 9.7, x: 0.2, markY: 1.3, who: 'father', whoX: 2.3, whoD: -0.7, required: true, order: 2, label: '선반의 종이를 센다', goal: '종이 선반',
          ev: [['s', 'father', 'neutral', '{name|아야}, 이 선반의 종이를 좀 세어 다오. 한 묶음에 스무 장씩이다.'], ['me', '하나, 둘, 셋… 묶음은 모두 열이다.'],
            ['s', 'father', 'neutral', '그래. 그럼 모두 몇 장이냐?'],
            ['ask', '스무 장씩 묶은 종이가 열 묶음입니다. 모두 몇 장일까요?', ['120장', '200장', '2,000장'], 1, '옳지, 이백 장이다. 두 팔로 안으면 딱 한 아름이지.'], ['exp', 'paper_bundle']],
          mem: [['s', 'father', 'neutral', '스무 장씩 열 묶음이면 이백 장. 두 팔로 안으면 딱 한 아름이다.']] },
        { id: 'paper', d: 6.6, x: -1.4, prop: 'prop_underground_paper', required: true, order: 3, label: '바닥에 떨어진 종이를 줍는다', goal: '떨어진 종이',
          ev: [['n', '바닥에 종이 한 장이 떨어져 있다. 누가 문틈으로 밀어 넣고 간 모양이다. 주워 드니 등사한 잉크 냄새가 난다.'], ['card', 'ds_date'],
            ['s', 'father', 'neutral', '「조선 건국」이라… 단군께서 나라를 세운 해부터 세는 햇수다. 서기에 2333을 더하면 된다.'], ['exp', 'dangi'], ['quiz', 'q2_4252'],
            ['card', 'ds_gist'], ['s', 'father', 'worry', '태화관이라면 인사동에 있는 집이다.'], ['quiz', 'q2_where'],
            ['n', '종이가 한 장 더 있다. 이것은 누가 손으로 베껴 쓴 것이다.'], ['card', 'kh_title'], ['me', '임금님이 돌아가신 까닭이라…. 지난달 할머니가 밖에서 듣고 오신 그 말이 떠오른다.'], ['quiz', 'q2_paper'],
            ['s', 'father', 'worry', '…이런 것을 들고 있다가는 큰일 난다. 이리 다오. {name|아야}, 오늘은 밖에 나가지 마라.'],
            ['me', '{hg|도} 같은 말을 했다. 묻지 마라, 나가지 마라.'], ['exp', 'child_1919'], ['go', 'c2c']],
          mem: [['s', 'father', 'neutral', '단군께서 나라를 세운 해부터 세는 햇수는 서기에 2333을 더하면 된다.']] }
      ] },
    c2c: { type: 'street', season: 'MAR', sky: 'bg_far_day_MAR', ground: 'tile_ground_dirt_MAR', length: 40, startD: 3, bgm: 'bgm_march_street',
      left: ['fac_shop_a_open', 'fac_wall_tile', 'fac_shop_b_open', 'fac_gate_house', 'fac_shop_a_open', 'fac_wall_tile'],
      right: ['fac_jimulpo_open', 'fac_shop_b_open', 'fac_board_wall', 'fac_shop_a_open', 'fac_gate_house', 'fac_shop_b_open'],
      sprites: [{ img: 'near_wood_bench', x: 4.4, d: 10.5, h: 0.55 }, { img: 'near_onggi', x: -4.7, d: 16, h: 1.25 }, { img: 'near_lamp_post', x: -4.9, d: 30, h: 5.2 }],
      crowds: [{ img: 'crowd_far_street', side: 'far', d: 66, w: 15 }],
      enter: [['n', '오후 두 시가 지났다. 멀리서 낯선 소리가 들린다. 아버지가 가게 앞을 살피러 나가셨고, 나도 뒤따라 문 앞에 섰다.']],
      nodes: [
        { id: 'ads', d: 10.5, side: 'R', x: 4.0, prop: 'prop_newspaper_folded', propY: 0.45, label: '오늘 신문의 광고를 본다',
          ev: [['card', 'ad_photo'], ['card', 'ad_student'], ['card', 'ad_pen'], ['card', 'ad_book'], ['me', '큰일이 벌어지는 날에도 신문에는 사진관 광고와 만년필 광고가 실린다. 우리 가게도 만년필을 고친다.']] },
        { id: 'students', d: 16, x: 1.0, who: 'npc_students', sil: 'pair', whoX: 2.0, whoD: 0.4, required: true, label: '뛰어가는 학생들을 본다', goal: '학생들',
          ev: [['n', '학생모를 쓴 학생들이 종이를 품에 안고 큰길 쪽으로 뛰어간다.'], ['s', '학생', null, '탑골공원이다! 벌써 다들 모였대!'],
            ['me', '탑골공원. 큰길로 나가면 금방인 곳이다. {hg|도} 저기에 있을까.'], ['exp', 'students_run']],
          mem: [['n', '3월 1일 오후, 학생들이 종이를 품에 안고 큰길 쪽으로 뛰어갔다.'], ['s', '학생', null, '탑골공원이다! 벌써 다들 모였대!']] },
        { id: 'decl', d: 24, x: -0.9, prop: 'prop_shop_note', required: true, label: '길에 떨어진 종이를 줍는다', goal: '떨어진 종이',
          ev: [['n', '바람에 종이 한 장이 굴러온다. 한자가 섞인 긴 글이다. 첫 줄만 겨우 읽었다.'], ['card', 'decl_1'], ['quiz', 'q2_decl'],
            ['n', '멀리 큰길 쪽에서 사람들의 소리가 밀려온다. 「대한 독립 만세.」'], ['exp', 'heard_manse'],
            ['me', '어젯밤 {hg|이가} 안고 나간 종이가 무엇이었는지, 이제 알 것 같다.'], ['quiz', 'q2_bundle'], ['concept', 'exp'],
            ['s', 'father', 'worry', '{name|아야}! 어서 들어가자.'],
            ['n', '그날 밤 {hg|은는} 늦게 돌아왔다. 아무 말도 하지 않았다. 손끝에 잉크가 묻어 있었다.'], ['end']] }
      ] }
  } };

  // ══════════════════ 3장 ══════════════════
  S.c3 = { title: '3장 · 반쪽 쪽지', date: '1919년 3월 3일 ~ 9일', place: '경성 종로', bgm: 'bgm_funeral_day', start: 'c3a', scenes: {
    c3a: { type: 'street', season: 'MAR', sky: 'bg_far_day_MAR', ground: 'tile_ground_dirt_MAR', length: 44, startD: 3,
      left: ['fac_wall_tile', 'fac_gate_house', 'fac_wall_tile', 'fac_shop_a_closed', 'fac_wall_tile'],
      right: ['fac_jimulpo_closed', 'fac_wall_tile', 'fac_gate_house', 'fac_wall_tile', 'fac_shop_b_closed'],
      crowds: [{ img: 'crowd_white_mourning', side: 'L', d: 14, w: 11.5 }, { img: 'crowd_white_mourning', side: 'R', d: 20, w: 11.5 }, { img: 'crowd_white_mourning', side: 'L', d: 26, w: 11.5 },
        { img: 'crowd_white_mourning', side: 'R', d: 32, w: 11.5 }, { img: 'crowd_white_mourning', side: 'L', d: 38, w: 11.5 }, { img: 'crowd_white_mourning', side: 'R', d: 44, w: 11.5 }],
      enter: [['t', '3장 · 반쪽 쪽지', '1919년 3월 3일, 임금님의 장례 날'], ['n', '지난 이야기 — 3월 1일, 길에서 선언서를 주웠고 큰길에서 만세 소리를 들었다. {hg|은는} 그날 밤늦게 돌아와 아무 말도 하지 않았다.'], ['s', 'grandma_white', 'neutral', '손 꼭 잡아라. 오늘은 사람이 많다.']],
      nodes: [
        { id: 'elder', d: 9, x: -1.4, who: 'npc_elder', sil: 'man', silTint: [1.48, 1.7, 1.86], whoX: -2.4, whoD: 0.3, required: true, label: '길을 묻는 할아버지를 돕는다', goal: '시골 할아버지',
          ev: [['s', '시골 할아버지', null, '얘야, 남대문역이 어느 쪽이냐? 임금님 가시는 길을 뵙고 모레 아침 기차로 내려가야 하는데, 서울 길이 처음이라.'],
            ['me', '「남대문 쪽으로 쭉 내려가시면 돼요. 멀리서 오셨어요?」'],
            ['s', '시골 할아버지', null, '사흘을 걸려 올라왔다. 우리 마을에서만 열이 넘게 왔지. 장례가 끝나면 역 앞이 고향 가는 사람으로 미어터질 게다.'], ['exp', 'country_visitor']],
          mem: [['s', '시골 할아버지', null, '임금님 가시는 길을 뵙고 모레 아침 기차로 내려간다. 사흘을 걸려 올라왔다. 우리 마을에서만 열이 넘게 왔지. 장례가 끝나면 역 앞이 고향 가는 사람으로 미어터질 게다.']] },
        { id: 'wait', d: 18, x: 0, who: 'grandma_white', whoX: 1.1, whoD: 0.3, required: true, label: '할머니 곁에 서서 행렬을 기다린다', goal: '할머니 곁',
          ev: [['n', '흰 옷, 흰 갓, 흰 수건. 길 양쪽이 온통 희다. 시골에서 올라온 사람도 많다고 했다.'], ['me', '이렇게 많은 사람이 이렇게 조용한 것은 처음 본다.'], ['exp', 'white_wave']],
          mem: [['n', '3월 3일, 길 양쪽이 흰 옷과 흰 갓으로 가득했다. 시골에서 올라온 사람도 많았다.']] },
        { id: 'news', d: 35, side: 'R', x: 1.6, prop: 'prop_newspaper_folded', required: true, label: '오늘 신문을 줍는다', goal: '신문',
          ev: [['card', 'mn_0303'], ['quiz', 'q3_wave'], ['concept', 'imply'], ['s', 'grandma_white', 'sad', '…조용하구나. 이렇게 사람이 많은데.'], ['go', 'c3b']] }
      ] },
    c3b: { type: 'room', night: true, length: 5.6, room: { wall: 'int_room_hangyeol_night', floor: 'tile_floor_jangpan' }, bgm: 'bgm_night_paper',
      enter: [['n', '3월 4일 밤. {hg}의 방.'], ['s', 'hg', 'neutral', '…{name|아야}, 미안하다. 요즘 통 얘기를 못 했지.'],
        ['s', 'hg', 'worry', '내일 아침엔 내가 일찍 나가. 혹시… 아니다.'], ['exp', 'hg_tomorrow'],
        ['me', '{hg|은는} 무언가 적던 종이를 찢었다. 반쪽은 품에 넣고, 반쪽은 책상에 남긴 채 방을 나갔다.']],
      nodes: [
        { id: 'news', d: 2.6, x: -1.3, prop: 'prop_newspaper_folded', label: '방바닥의 오늘 신문을 본다',
          ev: [['card', 'mn_0304'], ['quiz', 'q3_year']] },
        { id: 'cloth', d: 3.4, x: 0.1, strip: [0.72, 0.13, 0.12], required: true, label: '방바닥의 붉은 천 조각을 본다', goal: '붉은 천',
          ev: [['n', '방바닥에 붉은 천 조각이 떨어져 있다. 길게 찢어 낸 자투리다.'], ['me', '머리에 두르면 딱 맞을 길이다. 무엇에 쓰려는 걸까.'], ['exp', 'red_cloth']],
          mem: [['n', '3월 4일 밤, {hg}의 방바닥에 길게 찢은 붉은 천 조각이 떨어져 있었다.']] },
        { id: 'torn', d: 4.8, x: 1.0, prop: 'prop_note_torn_half', on: 'desk', required: true, label: '남은 반쪽 쪽지를 본다', goal: '책상',
          ev: [['card', 'hg_torn'], ['quiz', 'q3_torn'], ['concept', 'omit'], ['go', 'c3c']] }
      ] },
    c3c: { type: 'room', length: 5, room: { wall: 'int_maru_back_WIN', floor: 'tile_floor_maru' }, bgm: 'bgm_closed_shop',
      enter: [['n', '3월 5일. {hg|은는} 새벽같이 나갔다. 저녁이 되어도 돌아오지 않았다.'], ['n', '6일에도, 7일에도.'],
        ['s', 'mother', 'worry', '…밥은 먹고 다니는지.'], ['exp', 'mom_worry']],
      nodes: [
        { id: 'neighbor', d: 1.4, x: -1.8, who: 'npc_ajumma', sil: 'basket', whoX: -2.8, whoD: 0.2, required: true, order: 1, label: '대문간에 온 이웃 아주머니의 말을 듣는다', goal: '이웃 아주머니',
          ev: [['s', '이웃 아주머니', null, '그저께 아침에 남대문역 앞을 지나다 보았소. 학생들이 새까맣게 모여서, 머리에 붉은 띠를 두르고 만세를 부릅디다.'],
            ['s', '이웃 아주머니', null, '고향 가는 기차를 타려던 시골 사람들이 길을 가득 메우고 지켜보았다오. 그러다 순사들이 몰려와서….'],
            ['s', 'father', 'worry', '남대문역 앞에 모였던 학생들이 많이 잡혀갔다는구나.'], ['exp', 'station_arrest']],
          mem: [['s', '이웃 아주머니', null, '그저께 아침에 남대문역 앞을 지나다 보았소. 학생들이 새까맣게 모여서, 머리에 붉은 띠를 두르고 만세를 부릅디다.'], ['s', 'father', 'worry', '남대문역 앞에 모였던 학생들이 많이 잡혀갔다는구나.']] },
        { id: 'paper', order: 2, d: 4.2, x: -0.8, prop: 'prop_newspaper_open', on: 'desk', required: true, label: '3월 7일 신문을 펼친다', goal: '신문',
        ev: [['me', '그날 거리에서 내가 들은 소리는 「만세」였다. 신문은 그 일을 뭐라고 썼을까.'], ['card', 'mn_0307'], ['quiz', 'q3_soyo'], ['go', 'c3d']] }] },
    c3d: { type: 'street', season: 'MAR', sky: 'bg_far_day_MAR', ground: 'tile_ground_dirt_MAR', length: 30, startD: 3, bgm: 'bgm_closed_shop',
      left: ['fac_shop_a_closed', 'fac_gate_house', 'fac_shop_b_closed', 'fac_wall_tile', 'fac_shop_a_closed'],
      right: ['fac_shop_b_closed', { img: 'fac_jimulpo_closed', id: 'home' }, 'fac_shop_a_closed', 'fac_wall_tile', 'fac_gate_house'],
      sprites: [{ img: 'near_cart', x: -4.3, d: 9, h: 1.5 }, { img: 'near_onggi', x: 4.7, d: 27, h: 1.25 }],
      enter: [['n', '3월 8일 저녁. 심부름에서 돌아오는 길. 가게마다 문에 흰 종이가 붙어 있다. 우리 가게 문에도.']],
      nodes: [
        { id: 'merchants', d: 7.5, x: -2.2, who: 'npc_merchants', sil: 'pair', whoX: -3.3, whoD: 0.3, required: true, label: '가게 주인들의 이야기를 듣는다', goal: '가게 주인들',
          ev: [['n', '닫힌 가게 앞에 가게 주인 두 분이 서서 낮은 목소리로 이야기한다.'],
            ['s', '이웃 가게 아저씨', null, '학생들이 저렇게 잡혀가는데 우리만 물건을 팔고 앉았을 수는 없지 않소.'],
            ['s', '포목전 주인', null, '문을 닫읍시다. 장사꾼이 뜻을 보이는 길은 그것뿐이오. 다만 누구를 때리거나 부수는 일은 없어야 하오.'],
            ['me', '1월에도 가게들은 문을 닫았다. 그때는 임금님이 돌아가셔서였다. 이번에는 까닭이 다르다.'], ['exp', 'merchant_talk']],
          mem: [['s', '이웃 가게 아저씨', null, '학생들이 저렇게 잡혀가는데 우리만 물건을 팔고 앉았을 수는 없지 않소.'], ['s', '포목전 주인', null, '문을 닫읍시다. 장사꾼이 뜻을 보이는 길은 그것뿐이오. 다만 누구를 때리거나 부수는 일은 없어야 하오.']] },
        { id: 'note', at: 'home', side: 'R', required: true, label: '문에 붙은 쪽지를 읽는다', goal: '우리 가게',
        ev: [['card', 'shop_note'], ['s', 'father', 'neutral', '내일부터 종로 가게가 다 같이 문을 닫는다. 우리도 닫는다.'],
          ['me', '쪽지에는 「닫는다」고만 있다. 「왜」 닫는지는 쓰여 있지 않다.'], ['quiz', 'q3_close'], ['exp', 'shop_closing'],
          ['n', '3월 9일, 종로의 조선 사람 가게 천여 곳이 문을 닫았다. 닫힌 문은 4월 초까지 열리지 않았다.'], ['end']],
        mem: [['n', '3월 8일 저녁, 가게 문마다 쪽지가 붙었고 다음 날 천여 곳이 함께 문을 닫았다.'], ['card', 'shop_note']] }] }
  } };

  // ══════════════════ 4장 ══════════════════
  S.c4 = { title: '4장 · 누가, 왜 썼을까', date: '1919년 3월 중순 ~ 4월 15일', place: '경성 종로', bgm: 'bgm_closed_shop', start: 'c4a', scenes: {
    c4a: { type: 'room', length: 8.2, room: { wall: 'int_maru_back_APR', floor: 'tile_floor_maru' },
      enter: [['t', '4장 · 누가, 왜 썼을까', '1919년 3월 중순'], ['n', '지난 이야기 — 3월 5일 아침에 나간 {hg|은는} 돌아오지 않았다. 3월 9일, 종로 가게들이 다 함께 문을 닫았다.'], ['n', '가게는 닫혀 있고, {hg|은는} 돌아오지 않는다.'],
        ['s', 'father', 'worry', '가게 주인 대표 예순 명이 불려 갔단다. 어서 가게 문을 열라고 타이르더라는구나.'], ['exp', 'sixty_merchants']],
      nodes: [
        { id: 'oega', d: 2.6, x: -1.3, prop: 'prop_letter_envelope', on: 'desk', required: true, label: '외가에서 온 편지를 읽는다', goal: '편지',
          ev: [['card', 'oega_letter'], ['exp', 'country_news'], ['me', '내 또래 아이들이. …나는 문 앞에 서 있기만 했는데.']],
          mem: [['card', 'oega_letter']] },
        { id: 'papers', d: 5.2, x: 1.3, prop: 'prop_newspaper_open', on: 'desk', required: true, label: '쌓인 신문을 펼친다', goal: '신문 더미',
          ev: [['n', '가게를 닫은 뒤로 신문이 쌓였다. 날마다 누군가에게 무엇을 하라고 쓴 글이 실린다.'], ['card', 'mn_0309'], ['card', 'mn_0314'], ['quiz', 'q4_who'], ['concept', 'why'],
            ['n', '며칠 앞선 신문에는 이런 제목도 있다.'], ['card', 'mn_0308a'], ['card', 'mn_0308b'], ['quiz', 'q4_trust']] },
        { id: 'hgnote', d: 7.5, x: 0, prop: 'prop_note_folded', required: true, label: '누가 두고 간 쪽지를 펼친다', goal: '쪽지',
          ev: [['n', '저녁 무렵, 낯선 아이가 대문 안으로 쪽지를 던지고 달아났다.'], ['card', 'hg_letter1'],
            ['s', 'father', 'worry', '이름도, 있는 곳도 안 썼구나. …그럴 수밖에. 글 한 장 잘못 돌려도 잡혀가는 때다.'], ['exp', 'security_law'], ['quiz', 'q4_letter'],
            ['s', 'mother', 'sad', '…글씨는 한결이 글씨다. 틀림없다.'], ['go', 'c4b']],
          mem: [['s', 'father', 'worry', '글 한 장 잘못 돌려도 잡혀가는 때다. 그래서 이름도, 있는 곳도 쓰지 않은 것이다.'], ['card', 'hg_letter1']] }
      ] },
    c4b: { type: 'street', season: 'SPR23', sky: 'bg_far_day_APR', ground: 'tile_ground_dirt_SPR23', length: 36, startD: 3, end: { img: 'fac_gate_house', w: 10 },
      left: ['fac_shop_a_open', { img: 'fac_board_wall', id: 'board' }, 'fac_shop_b_open', 'fac_wall_tile'],
      right: ['fac_jimulpo_open', 'fac_shop_b_open', 'fac_wall_tile', 'fac_shop_a_open'],
      sprites: [{ img: 'near_wood_bench', x: 4.4, d: 12, h: 0.55 }, { img: 'near_jige', x: -4.9, d: 30, h: 1.5 }],
      enter: [['n', '4월 15일. 가게들은 다시 문을 열었다. 그런데 벽보판 앞에 사람들이 말없이 서 있다.']],
      nodes: [
        { id: 'reopen', d: 7.5, x: 2.4, who: 'npc_shopman', sil: 'man3', whoX: 3.6, whoD: 0.2, required: true, label: '다시 문을 연 이웃 아저씨와 이야기한다', goal: '이웃 가게',
          ev: [['s', '이웃 가게 아저씨', null, '한 달 가까이 닫았더니 쌀독이 다 비었다. 문을 열기는 열었다만, 마음까지 연 것은 아니다.'],
            ['me', '종로 가게들은 3월 9일에 문을 닫아 4월 초에야 다시 열었다.'], ['exp', 'reopened']],
          mem: [['s', '이웃 가게 아저씨', null, '한 달 가까이 닫았더니 쌀독이 다 비었다. 문을 열기는 열었다만, 마음까지 연 것은 아니다.']] },
        { id: 'law', at: 'board', side: 'L', required: true, label: '벽보판에 붙은 새 법을 읽는다', goal: '벽보판',
          ev: [['n', '일본 글자로 쓴 새 법이다. 어른들이 떠듬떠듬 뜻을 옮겨 주었다.'], ['card', 'law7'], ['quiz', 'q4_law'], ['exp', 'law_fear'], ['concept', 'judge']],
          mem: [['card', 'law7']] },
        { id: 'home', at: 'END', who: 'father', whoFace: 'sad', whoD: 0.6, required: true, label: '집으로 돌아간다', goal: '집',
          ev: [['s', 'father', 'sad', '…한결이가 잡혔단다. 살아는 있단다.'], ['exp', 'hg_caught'], ['s', 'mother', 'sad', '…………'],
            ['me', '아무도 울지 않았다. 할머니는 등잔 심지를 돋우셨다.'], 
            ['s', 'grandma', 'sad', '불을 끄지 마라. 밤이 길수록 불을 켜 두어야, 돌아오는 사람이 제 집을 찾는다.'], ['exp', 'grandma_lamp'], ['end']],
          mem: [['s', 'father', 'sad', '…한결이가 잡혔단다. 살아는 있단다.'], ['n', '아무도 울지 않았다. 할머니는 등잔 심지를 돋우셨다.'], ['s', 'grandma', 'sad', '불을 끄지 마라. 밤이 길수록 불을 켜 두어야, 돌아오는 사람이 제 집을 찾는다.']] }
      ] }
  } };

  // ══════════════════ 5장 ══════════════════
  S.c5 = { title: '5장 · 돌려 말하는 봄', date: '1919년 4월 말', place: '경성 종로', bgm: 'bgm_letter_spring', start: 'c5a', scenes: {
    c5a: { type: 'room', length: 8.2, room: { wall: 'int_maru_back_APR', floor: 'tile_floor_maru' },
      enter: [['t', '5장 · 돌려 말하는 봄', '1919년 4월 말'], ['n', '지난 이야기 — {hg|이가} 잡혔다는 소식이 왔다. 이름 없는 쪽지 한 장을 받았고, 거리에는 「하려고만 해도」 벌한다는 새 법이 붙었다.'], ['n', '꽃이 지고 있다. 아침에 대문을 여니 문 앞에 편지 한 통이 놓여 있었다.']],
      nodes: [
        { id: 'letter', d: 2.8, x: -1.2, prop: 'prop_letter_open', on: 'desk', required: true, label: '문 앞에 있던 편지를 읽는다', goal: '편지',
          ev: [['s', 'father', 'worry', '누가 밤사이 놓고 간 것이다. 가져오다 들키면 큰일이니, 남이 읽어도 모르게 썼을 게다. 겉말만 읽지 말고 속말을 읽어야 한다.'], ['exp', 'hidden_words'], ['card', 'hg_letter2'], ['exp', 'lamp_letter'], ['me', '{hg}의 글씨다. 그런데 이상하다. 등불이니 밤이니, 하나 마나 한 말만 쓰여 있다.'], ['quiz', 'q5_words']],
          mem: [['s', 'father', 'worry', '누가 밤사이 놓고 간 것이다. 가져오다 들키면 큰일이니, 남이 읽어도 모르게 썼을 게다. 겉말만 읽지 말고 속말을 읽어야 한다.']] },
        { id: 'family', d: 5.2, x: 1.2, who: 'mother', whoX: 2.3, required: true, label: '식구들 곁에 앉는다', goal: '식구들',
          ev: [['n', '아침상을 물릴 때였다. 어머니는 {hg}의 밥그릇만은 치우지 않고, 뚜껑을 덮어 상 한쪽에 그대로 두셨다.'],
            ['s', 'mother', 'worry', '…그 애는, 밥은 먹었을까.'], ['me', '어머니는 {hg|이가} 돌아오지 않던 날에도 밥 이야기만 하셨다.'],
            ['s', 'father', 'neutral', '…오늘 밤부터는 대문을 걸지 말고 두자.'], ['me', '밤이면 늘 걸어 잠그던 대문이다.'],
            ['s', 'grandma', 'smile', '봄은 오고야 만다.'], ['quiz', 'q5_lines'], ['exp', 'mom_rice']],
          mem: [['n', '어머니는 {hg}의 밥그릇만은 치우지 않고, 뚜껑을 덮어 상 한쪽에 그대로 두셨다.'], ['s', 'mother', 'worry', '…그 애는, 밥은 먹었을까.']] },
        { id: 'write', d: 7.5, x: 0, prop: 'prop_brush_inkstone', on: 'desk', required: true, label: '붓을 들어 답장을 쓴다', goal: '벼루',
          ev: [['me', '답장을 쓰자. {hg|이가} 한 것처럼, 돌려서.'], ['quiz', 'q5_reply'],
            ['n', '답장을 접어 서랍에 넣었다. 전할 길은 아직 없다.'], ['end']] }
      ] }
  } };

  // ══════════════════ 에필로그 1 ══════════════════
  S.e1 = { title: '에필로그 1 · 등불 켜는 이', date: '1920년 8월', place: '경성 종로', bgm: 'bgm_lamplighter_1920', start: 'e1a', scenes: {
    e1a: { type: 'street', season: 'SUM', sky: 'bg_far_day_SUM', ground: 'tile_ground_dirt_SUM', length: 34, startD: 3,
      left: ['fac_shop_a_open', 'fac_gate_house', 'fac_shop_b_open', 'fac_wall_tile', 'fac_shop_a_open'],
      right: ['fac_shop_b_open', { img: 'fac_wall_tile', id: 'school' }, { img: 'fac_jimulpo_open', id: 'home' }, 'fac_gate_house', 'fac_wall_tile'],
      sprites: [{ img: 'near_wood_bench', x: -4.4, d: 12, h: 0.55 }, { img: 'near_onggi', x: -4.7, d: 6, h: 1.25 }, { img: 'near_cart', x: -4.3, d: 24, h: 1.5 }],
      crowds: [{ img: 'crowd_passersby', side: 'far', d: 44, w: 10 }],
      enter: [['t', '에필로그 1 · 등불 켜는 이', '1920년 8월'], ['n', '지난 이야기 — 1919년 봄, 나는 {hg}에게 돌려 말하는 답장을 써서 서랍에 넣었다. 전하지는 못했다. 그 뒤로 한 해가 지났다.'], ['n', '나는 열세 살이 되었다. 가게 문은 다시 열렸고, 종로에는 새 신문 두 가지가 나온다. 어떤 날 치는 팔지 못하게 빼앗기기도 한다.']],
      nodes: [
        { id: 'newsstand', d: 12, side: 'L', x: -4.0, prop: 'prop_newspaper_folded', propY: 0.45, who: 'npc_newsman', sil: 'man4', whoX: -3.0, whoD: 1.4, required: true, label: '평상에 놓인 새 신문을 본다', goal: '새 신문',
          ev: [['n', '평상 위에 처음 보는 신문 두 가지가 놓여 있다. 『조선일보』와 『동아일보』.'],
            ['s', '신문 파는 아저씨', null, '올봄에 새로 나온 조선 사람 신문이다. 그런데 어떤 날 치는 팔기도 전에 통째로 빼앗긴단다.'],
            ['me', '작년까지 조선말 신문은 『매일신보』 하나뿐이었다. 이제 세 가지가 되었다. 그런데 빼앗기는 날이 있다.'], ['exp', 'new_papers']],
          mem: [['n', '1920년 여름, 평상 위에 『조선일보』와 『동아일보』가 놓여 있었다.'], ['s', '신문 파는 아저씨', null, '올봄에 새로 나온 조선 사람 신문이다. 그런데 어떤 날 치는 팔기도 전에 통째로 빼앗긴단다.']] },
        { id: 'school', at: 'school', side: 'R', required: true, goal: '학교 담장', label: '보통학교 담장을 지난다', markY: 1.6,
          ev: [['me', '선생님들은 이제 칼을 차지 않는다. 조선 사람만 매로 때리던 벌도 지난 4월에 없어졌다고 한다.'], ['exp', 'change_1920']],
          mem: [['me', '1920년, 선생님들은 칼을 차지 않게 되었고 매로 때리는 벌도 없어졌다.']] },
        { id: 'home', at: 'home', side: 'R', required: true, label: '가게로 들어간다', goal: '우리 가게', ev: [['go', 'e1b']] }
      ] },
    e1b: { type: 'room', length: 7.4, room: { wall: 'int_jimulpo_back_SUM', floor: 'tile_floor_maru' },
      enter: [['s', 'father', 'smile', '{name|아야}, 새 잡지가 들어왔다. 『개벽』이라는구나. 첫 호는 다 빼앗겼다더니 이번 것은 무사히 왔다.'],
        ['n', '그때 가게 문이 열렸다.'], ['s', 'hg20', 'neutral', '……다녀왔습니다.'], ['s', 'father', 'sad', '…왔느냐.'],
        ['me', '{hg|은는} 많이 야위었다. 그동안의 일은 한마디도 하지 않았다. 나도 묻지 않았다.']],
      nodes: [
        { id: 'mag', d: 3.2, x: -1.2, prop: 'prop_magazine', on: 'desk', required: true, label: '『개벽』 제3호를 펼친다', goal: '새 잡지',
          ev: [['card', 'lamp_poem'], ['s', 'hg20', 'smile', '…좋은 글이네. 「어린이」라. 처음 듣는 말이다.'], ['quiz', 'e1_lamp']] },
        { id: 'record', d: 6.6, x: 1.3, prop: 'prop_note_folded', on: 'desk', required: true, label: '읽기 수첩에 덧붙인 기록을 본다', goal: '덧붙인 기록',
          ev: [['n', '훗날 사람들은 1919년 봄의 일을 숫자로 적었다. 이야기 밖의 기록을 하나 덧붙인다.'], ['card', 'stats_table'], ['quiz', 'e1_stats'], ['quiz', 'e1_change'],
            ['n', '그해 여름 저녁마다 {hg|은는} 마루 끝에 앉아 등잔 심지를 돋우었다. 나는 그 옆에서 잡지를 소리 내어 읽었다.'], ['end']] }
      ] }
  } };

  // ══════════════════ 에필로그 2 ══════════════════
  S.e2 = { title: '에필로그 2 · 다락방의 편지', date: '1923년 5월 1일', place: '경성 종로', bgm: 'bgm_childrens_day_1923', start: 'e2a', scenes: {
    e2a: { type: 'street', season: 'SPR23', sky: 'bg_far_day_SPR23', ground: 'tile_ground_dirt_SPR23', length: 40, startD: 3, end: { img: 'fac_gate_house', w: 10 },
      left: ['fac_shop_a_open', 'fac_gate_house', 'fac_shop_b_open', 'fac_board_wall', 'fac_shop_a_open'],
      right: ['fac_jimulpo_open', 'fac_shop_b_open', 'fac_wall_tile', 'fac_shop_a_open', 'fac_gate_house'],
      crowds: [{ img: 'crowd_children_1923', side: 'L', d: 14, w: 6 }, { img: 'crowd_children_1923', side: 'L', d: 21.5, w: 6 }, { img: 'crowd_children_1923', side: 'R', d: 26, w: 6 }, { img: 'crowd_children_1923', side: 'R', d: 33, w: 6 }],
      sprites: [{ img: 'near_wood_bench', x: 4.4, d: 9, h: 0.55 }],
      enter: [['t', '에필로그 2 · 다락방의 편지', '1923년 5월 1일'], ['n', '지난 이야기 — 1920년 여름에 {hg|이가} 돌아왔다. 그동안의 일은 말하지 않았다. 다시 세 해가 지났다.'], ['n', '나는 열여섯 살이다. {hg|은는} 인쇄소에서 일한다. 오늘 종로에는 아이들이 종이를 들고 뛰어다닌다.']],
      nodes: [
        { id: 'leaflet', d: 17, x: -1.0, prop: 'prop_leaflet_stack', who: 'bomi23', whoFace: 'smile', whoX: 0.4, required: true, label: '아이들이 나눠 주는 종이를 받는다', goal: '아이들',
          ev: [['n', '오늘은 「어린이날」이라고 했다. 이런 종이를 십이만 장이나 뿌린다고 한다.'],
            ['s', 'bomi23', 'surprise', '{bme}! 이거 읽어 줘. 어른들한테 주는 글이래!'], ['card', 'child_day'], ['quiz', 'e2_day'],
            ['s', 'bomi23', 'smile', '그럼 {bme}도 나한테 높임말 써 봐. 「봄이 씨, 진지 잡수셨어요?」 해 봐!'], ['me', '웃음이 났다. 열두 살의 나는 누구에게도 그런 말을 들어 본 적이 없다.']] },
        { id: 'home', at: 'END', required: true, label: '집으로 돌아간다', goal: '집', ev: [['go', 'e2b']] }
      ] },
    e2b: { type: 'room', length: 5.2, room: { wall: 'int_attic', floor: 'tile_floor_attic', wallColor: [0.47, 0.33, 0.24], beamColor: [0.33, 0.22, 0.16], ceilColor: [0.22, 0.15, 0.11] }, bgm: 'bgm_attic_ending',
      enter: [['n', '저녁. 봄이가 다락에서 낡은 상자를 찾았다고 했다.'], ['s', 'bomi23', 'neutral', '{bme}, 이 상자 뭐야? 종이만 잔뜩 들었어.']],
      nodes: [{ id: 'box', d: 4.4, x: 0.4, prop: 'prop_box_attic', propH: 0.75, required: true, label: '상자를 연다', goal: '낡은 상자',
        ev: [['n', '1919년 봄의 종이들이다. 반쪽 쪽지, 신문 조각, 가게 문에 붙었던 쪽지.'],
          ['n', '그리고 맨 밑에, 처음 보는 편지 한 통. 부치지 못한 편지다.'], ['card', 'hg_unsent'], ['quiz', 'e2_final'], ['ending']] }] }
  } };

  window.STORY = { order: ['p', 'c1', 'c2', 'c3', 'c4', 'c5', 'e1', 'e2'], chapters: S };
})();
