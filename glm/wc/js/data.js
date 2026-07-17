/* ===== FIFA Top 10 Rankings ===== */
var TOP10=[
    {rank:1,code:'FRA',name:'France',pts:1948.97},
    {rank:2,code:'ARG',name:'Argentina',pts:1925.15},
    {rank:3,code:'ESP',name:'Spain',pts:1912.34},
    {rank:4,code:'ENG',name:'England',pts:1871.39},
    {rank:5,code:'BRA',name:'Brazil',pts:1804.92},
    {rank:6,code:'MAR',name:'Morocco',pts:1803.99},
    {rank:7,code:'POR',name:'Portugal',pts:1787.85},
    {rank:8,code:'BEL',name:'Belgium',pts:1778.36},
    {rank:9,code:'NED',name:'Netherlands',pts:1775.54},
    {rank:10,code:'MEX',name:'Mexico',pts:1754.30}
  ];
  
  /* ===== Team names + flags ===== */
  var TM={
    MEX:{n:'Mexico',f:'\u{1F1F2}\u{1F1FD}'},RSA:{n:'South Africa',f:'\u{1F1FF}\u{1F1E6}'},
    KOR:{n:'South Korea',f:'\u{1F1F0}\u{1F1F7}'},CZE:{n:'Czech Rep.',f:'\u{1F1E8}\u{1F1FF}'},
    SUI:{n:'Switzerland',f:'\u{1F1E8}\u{1F1ED}'},CAN:{n:'Canada',f:'\u{1F1E8}\u{1F1E6}'},
    BIH:{n:'Bosnia & Herz.',f:'\u{1F1E7}\u{1F1E6}'},QAT:{n:'Qatar',f:'\u{1F1F6}\u{1F1E6}'},
    BRA:{n:'Brazil',f:'\u{1F1E7}\u{1F1F7}'},MAR:{n:'Morocco',f:'\u{1F1F2}\u{1F1E6}'},
    SCO:{n:'Scotland',f:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}'},HAI:{n:'Haiti',f:'\u{1F1ED}\u{1F1F9}'},
    USA:{n:'USA',f:'\u{1F1FA}\u{1F1F8}'},AUS:{n:'Australia',f:'\u{1F1E6}\u{1F1FA}'},
    PAR:{n:'Paraguay',f:'\u{1F1F5}\u{1F1FE}'},TUR:{n:'Turkey',f:'\u{1F1F9}\u{1F1F7}'},
    GER:{n:'Germany',f:'\u{1F1E9}\u{1F1EA}'},CIV:{n:"C\u00F4te d'Ivoire",f:'\u{1F1E8}\u{1F1EE}'},
    ECU:{n:'Ecuador',f:'\u{1F1EA}\u{1F1E8}'},CUW:{n:'Cura\u00E7ao',f:'\u{1F1E8}\u{1F1FC}'},
    NED:{n:'Netherlands',f:'\u{1F1F3}\u{1F1F1}'},JPN:{n:'Japan',f:'\u{1F1EF}\u{1F1F5}'},
    SWE:{n:'Sweden',f:'\u{1F1F8}\u{1F1EA}'},TUN:{n:'Tunisia',f:'\u{1F1F9}\u{1F1F3}'},
    BEL:{n:'Belgium',f:'\u{1F1E7}\u{1F1EA}'},EGY:{n:'Egypt',f:'\u{1F1EA}\u{1F1EC}'},
    IRN:{n:'Iran',f:'\u{1F1EE}\u{1F1F7}'},NZL:{n:'New Zealand',f:'\u{1F1F3}\u{1F1FF}'},
    ESP:{n:'Spain',f:'\u{1F1EA}\u{1F1F8}'},CPV:{n:'Cape Verde',f:'\u{1F1E8}\u{1F1FB}'},
    URU:{n:'Uruguay',f:'\u{1F1FA}\u{1F1FE}'},KSA:{n:'Saudi Arabia',f:'\u{1F1F8}\u{1F1E6}'},
    FRA:{n:'France',f:'\u{1F1EB}\u{1F1F7}'},NOR:{n:'Norway',f:'\u{1F1F3}\u{1F1F4}'},
    SEN:{n:'Senegal',f:'\u{1F1F8}\u{1F1F3}'},IRQ:{n:'Iraq',f:'\u{1F1EE}\u{1F1F6}'},
    ARG:{n:'Argentina',f:'\u{1F1E6}\u{1F1F7}'},AUT:{n:'Austria',f:'\u{1F1E6}\u{1F1F9}'},
    ALG:{n:'Algeria',f:'\u{1F1E9}\u{1F1FF}'},JOR:{n:'Jordan',f:'\u{1F1EF}\u{1F1F4}'},
    COL:{n:'Colombia',f:'\u{1F1E8}\u{1F1F4}'},POR:{n:'Portugal',f:'\u{1F1F5}\u{1F1F9}'},
    COD:{n:'DR Congo',f:'\u{1F1E8}\u{1F1E9}'},UZB:{n:'Uzbekistan',f:'\u{1F1FA}\u{1F1FF}'},
    ENG:{n:'England',f:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'},CRO:{n:'Croatia',f:'\u{1F1ED}\u{1F1F7}'},
    GHA:{n:'Ghana',f:'\u{1F1EC}\u{1F1ED}'},PAN:{n:'Panama',f:'\u{1F1F5}\u{1F1E6}'}
  };
  
  /* ===== Group standings (index 0=1st, 1=2nd, 2=3rd, 3=4th) ===== */
  var GR={
    A:[{t:'MEX',mp:3,w:3,d:0,l:0,gf:6,ga:0,gd:6,pts:9},{t:'RSA',mp:3,w:1,d:1,l:1,gf:2,ga:3,gd:-1,pts:4},{t:'KOR',mp:3,w:1,d:0,l:2,gf:2,ga:3,gd:-1,pts:3},{t:'CZE',mp:3,w:0,d:1,l:2,gf:2,ga:6,gd:-4,pts:1}],
    B:[{t:'SUI',mp:3,w:2,d:1,l:0,gf:7,ga:3,gd:4,pts:7},{t:'CAN',mp:3,w:1,d:1,l:1,gf:8,ga:3,gd:5,pts:4},{t:'BIH',mp:3,w:1,d:1,l:1,gf:5,ga:6,gd:-1,pts:4},{t:'QAT',mp:3,w:0,d:1,l:2,gf:2,ga:10,gd:-8,pts:1}],
    C:[{t:'BRA',mp:3,w:2,d:1,l:0,gf:7,ga:1,gd:6,pts:7},{t:'MAR',mp:3,w:2,d:1,l:0,gf:6,ga:3,gd:3,pts:7},{t:'SCO',mp:3,w:1,d:0,l:2,gf:1,ga:4,gd:-3,pts:3},{t:'HAI',mp:3,w:0,d:0,l:3,gf:2,ga:8,gd:-6,pts:0}],
    D:[{t:'USA',mp:3,w:2,d:0,l:1,gf:8,ga:4,gd:4,pts:6},{t:'AUS',mp:3,w:1,d:1,l:1,gf:2,ga:2,gd:0,pts:4},{t:'PAR',mp:3,w:1,d:1,l:1,gf:2,ga:4,gd:-2,pts:4},{t:'TUR',mp:3,w:1,d:0,l:2,gf:3,ga:5,gd:-2,pts:3}],
    E:[{t:'GER',mp:3,w:2,d:0,l:1,gf:10,ga:4,gd:6,pts:6},{t:'CIV',mp:3,w:2,d:0,l:1,gf:4,ga:2,gd:2,pts:6},{t:'ECU',mp:3,w:1,d:1,l:1,gf:2,ga:2,gd:0,pts:4},{t:'CUW',mp:3,w:0,d:1,l:2,gf:1,ga:9,gd:-8,pts:1}],
    F:[{t:'NED',mp:3,w:2,d:1,l:0,gf:10,ga:4,gd:6,pts:7},{t:'JPN',mp:3,w:1,d:2,l:0,gf:7,ga:3,gd:4,pts:5},{t:'SWE',mp:3,w:1,d:1,l:1,gf:7,ga:7,gd:0,pts:4},{t:'TUN',mp:3,w:0,d:0,l:3,gf:2,ga:12,gd:-10,pts:0}],
    G:[{t:'BEL',mp:3,w:1,d:2,l:0,gf:6,ga:2,gd:4,pts:5},{t:'EGY',mp:3,w:1,d:2,l:0,gf:5,ga:3,gd:2,pts:5},{t:'IRN',mp:3,w:0,d:3,l:0,gf:3,ga:3,gd:0,pts:3},{t:'NZL',mp:3,w:0,d:1,l:2,gf:4,ga:10,gd:-6,pts:1}],
    H:[{t:'ESP',mp:3,w:2,d:1,l:0,gf:5,ga:0,gd:5,pts:7},{t:'CPV',mp:3,w:0,d:3,l:0,gf:2,ga:2,gd:0,pts:3},{t:'URU',mp:3,w:0,d:2,l:1,gf:3,ga:4,gd:-1,pts:2},{t:'KSA',mp:3,w:0,d:2,l:1,gf:1,ga:5,gd:-4,pts:2}],
    I:[{t:'FRA',mp:3,w:3,d:0,l:0,gf:10,ga:2,gd:8,pts:9},{t:'NOR',mp:3,w:2,d:0,l:1,gf:8,ga:7,gd:1,pts:6},{t:'SEN',mp:3,w:1,d:0,l:2,gf:8,ga:6,gd:2,pts:3},{t:'IRQ',mp:3,w:0,d:0,l:3,gf:1,ga:12,gd:-11,pts:0}],
    J:[{t:'ARG',mp:3,w:3,d:0,l:0,gf:8,ga:1,gd:7,pts:9},{t:'AUT',mp:3,w:1,d:1,l:1,gf:6,ga:6,gd:0,pts:4},{t:'ALG',mp:3,w:1,d:1,l:1,gf:5,ga:7,gd:-2,pts:4},{t:'JOR',mp:3,w:0,d:0,l:3,gf:3,ga:8,gd:-5,pts:0}],
    K:[{t:'COL',mp:3,w:2,d:1,l:0,gf:4,ga:1,gd:3,pts:7},{t:'POR',mp:3,w:1,d:2,l:0,gf:6,ga:1,gd:5,pts:5},{t:'COD',mp:3,w:1,d:1,l:1,gf:4,ga:3,gd:1,pts:4},{t:'UZB',mp:3,w:0,d:0,l:3,gf:2,ga:11,gd:-9,pts:0}],
    L:[{t:'ENG',mp:3,w:2,d:1,l:0,gf:6,ga:2,gd:4,pts:7},{t:'CRO',mp:3,w:2,d:0,l:1,gf:5,ga:5,gd:0,pts:6},{t:'GHA',mp:3,w:1,d:1,l:1,gf:2,ga:2,gd:0,pts:4},{t:'PAN',mp:3,w:0,d:0,l:3,gf:0,ga:4,gd:-4,pts:0}]
  };
  
  /* ===== 3rd-place teams (ordered by bracket slot) ===== */
  var TP=['PAR','SWE','SEN','BIH','ECU','COD','ALG','GHA'];
  
  /* ===== Bracket structure ===== */
  var R32D=[
    {id:'r32_0',s1:{ty:'g',g:'A',p:2},s2:{ty:'g',g:'B',p:2}},
    {id:'r32_1',s1:{ty:'g',g:'F',p:1},s2:{ty:'g',g:'C',p:2}},
    {id:'r32_2',s1:{ty:'g',g:'E',p:1},s2:{ty:'3',i:0}},
    {id:'r32_3',s1:{ty:'g',g:'I',p:1},s2:{ty:'3',i:1}},
    {id:'r32_4',s1:{ty:'g',g:'H',p:1},s2:{ty:'g',g:'J',p:2}},
    {id:'r32_5',s1:{ty:'g',g:'K',p:2},s2:{ty:'g',g:'L',p:2}},
    {id:'r32_6',s1:{ty:'g',g:'G',p:1},s2:{ty:'3',i:2}},
    {id:'r32_7',s1:{ty:'g',g:'D',p:1},s2:{ty:'3',i:3}},
    {id:'r32_8',s1:{ty:'g',g:'C',p:1},s2:{ty:'g',g:'F',p:2}},
    {id:'r32_9',s1:{ty:'g',g:'E',p:2},s2:{ty:'g',g:'I',p:2}},
    {id:'r32_10',s1:{ty:'g',g:'A',p:1},s2:{ty:'3',i:4}},
    {id:'r32_11',s1:{ty:'g',g:'L',p:1},s2:{ty:'3',i:5}},
    {id:'r32_12',s1:{ty:'g',g:'D',p:2},s2:{ty:'g',g:'G',p:2}},
    {id:'r32_13',s1:{ty:'g',g:'J',p:1},s2:{ty:'g',g:'H',p:2}},
    {id:'r32_14',s1:{ty:'g',g:'B',p:1},s2:{ty:'3',i:6}},
    {id:'r32_15',s1:{ty:'g',g:'K',p:1},s2:{ty:'3',i:7}}
  ];
  var R16D=[
    {id:'r16_0',fd:['r32_0','r32_1']},{id:'r16_1',fd:['r32_2','r32_3']},
    {id:'r16_2',fd:['r32_4','r32_5']},{id:'r16_3',fd:['r32_6','r32_7']},
    {id:'r16_4',fd:['r32_8','r32_9']},{id:'r16_5',fd:['r32_10','r32_11']},
    {id:'r16_6',fd:['r32_12','r32_13']},{id:'r16_7',fd:['r32_14','r32_15']}
  ];
  var QFD=[
    {id:'qf_0',fd:['r16_0','r16_1']},{id:'qf_1',fd:['r16_2','r16_3']},
    {id:'qf_2',fd:['r16_4','r16_5']},{id:'qf_3',fd:['r16_6','r16_7']}
  ];
  var SFD=[{id:'sf_0',fd:['qf_0','qf_1']},{id:'sf_1',fd:['qf_2','qf_3']}];
  var FID={id:'final',fd:['sf_0','sf_1']};
  
  /* ===== Pre-filled results (sc=score, w=winner code, pn=penalties) ===== */
  var INIT={
    'r32_0':{sc:'0-1',w:'CAN'},'r32_1':{sc:'1-1',w:'MAR',pn:'2-3'},
    'r32_2':{sc:'1-1',w:'GER',pn:'4-3'},'r32_3':{sc:'3-0',w:'FRA'},
    'r32_4':{sc:'3-0',w:'ESP'},'r32_5':{sc:'2-1',w:'POR'},
    'r32_6':{sc:'3-2',w:'BEL'},'r32_7':{sc:'2-0',w:'USA'},
    'r32_8':{sc:'2-1',w:'BRA'},'r32_9':{sc:'1-2',w:'NOR'},
    'r32_10':{sc:'2-0',w:'MEX'},'r32_11':{sc:'2-1',w:'ENG'},
    'r32_12':{sc:'1-1',w:'EGY',pn:'2-4'},'r32_13':{sc:'3-2',w:'ARG'},
    'r32_14':{sc:'2-0',w:'SUI'},'r32_15':{sc:'1-0',w:'COL'},
    'r16_0':{sc:'0-3',w:'MAR'},'r16_1':{sc:'0-1',w:'FRA'},
    'r16_2':{sc:'0-1',w:'ESP'},'r16_3':{sc:'1-4',w:'BEL'},
    'r16_4':{sc:'1-2',w:'NOR'},'r16_5':{sc:'2-3',w:'ENG'},
    'r16_6':{sc:'3-2',w:'ARG'},'r16_7':{sc:'0-0',w:'SUI',pn:'4-3'},
    'qf_0':{sc:'2-0',w:'FRA'},'qf_1':{sc:'2-1',w:'ESP'},
    'qf_2':{sc:'2-1',w:'ENG'},'qf_3':{sc:'3-1',w:'ARG'},
    'sf_0':{sc:'0-1',w:'ESP'},'sf_1':{sc:'2-1',w:'ARG'}
  };