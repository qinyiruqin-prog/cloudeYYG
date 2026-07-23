// 人机网友生成系统

const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林'];
const GIVEN_NAMES = ['明', '华', '强', '军', '建', '伟', '芳', '娜', '静', '丽', '敏', '艳', '磊', '鹏', '杰', '涛', '浩', '轩', '宇', '婷', '雪', '梅', '玲', '倩'];

const NICKNAMES = [
  '路过的网友', '吃瓜群众', '热心市民', '匿名用户', '神秘人',
  '不愿透露姓名的人', '某网友', '路人甲', '观众', '潜水员',
  '萌新', '老司机', '技术宅', '划水党', '打工人',
  '代码搬运工', '深夜emo', '早起鸟', '夜猫子', '社恐人士'
];

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=',
  'https://api.dicebear.com/7.x/bottts/svg?seed=',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=',
];

export interface BotUser {
  name: string;
  avatar?: string;
}

/**
 * 生成随机人机网友
 */
export function generateBotUser(): BotUser {
  const useRealName = Math.random() > 0.5;

  if (useRealName) {
    // 生成真实姓名
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const givenName = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
    const name = surname + givenName;

    // 随机头像
    const avatarType = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const avatar = avatarType + encodeURIComponent(name) + Math.random();

    return { name, avatar };
  } else {
    // 使用昵称
    const name = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)] + Math.floor(Math.random() * 999);
    return { name };
  }
}

/**
 * 生成预制帖子内容
 */
export const PRESET_POSTS = [
  {
    title: '男朋友说我做饭难吃，我该怎么办？',
    body: '今天做了西红柿炒鸡蛋，他尝了一口就说太咸了。我明明按菜谱来的啊！然后他又说上次的糖醋排骨也不行。我是不是真的没有做饭天赋😭',
    board: '日常',
  },
  {
    title: '室友每天晚上打游戏吼叫，我快疯了',
    body: '凌晨两三点还在那吼"给我杀！"、"这波能赢！"。我第二天还要上班啊，跟他说了好几次都没用。有什么办法能让他闭嘴吗？',
    board: '求助',
  },
  {
    title: '分享一下我家猫的沙雕日常',
    body: '今天我家猫趁我不注意，跳到桌子上把我的奶茶打翻了。然后它舔了一口，表情瞬间扭曲，估计是觉得太甜了哈哈哈。最后还一脸无辜地看着我，好像在说"不是我干的"。',
    board: '故事',
  },
  {
    title: '有没有人和我一样，一到周日晚上就焦虑？',
    body: '每次周日晚上就开始想明天要上班/上学，整个人都不好了。躺在床上刷手机到凌晨，就是不想睡，感觉睡了第二天就来了。有同款的吗？',
    board: '日常',
  },
  {
    title: '老妈又催婚了，我该怎么应对？',
    body: '每次打电话都要问"有对象了吗？"、"你看隔壁xxx都结婚了"。我才25岁啊！真的很烦，但又不想惹她生气。大家都是怎么应付父母催婚的？',
    board: '求助',
  },
  {
    title: '今天坐地铁遇到一个超尴尬的事',
    body: '人太多被挤到一个帅哥身边，然后我手机掉了，弯腰去捡的时候头撞到他的...咳咳。抬头的时候四目相对，我恨不得找个地缝钻进去😳',
    board: '故事',
  },
  {
    title: '吐槽一下外卖小哥的迷惑行为',
    body: '明明备注了"放门口就行"，结果他非要打电话让我下楼拿。我说我在忙，他就站在楼下一直打。最后我穿着睡衣下去拿的，尴尬死了。',
    board: '日常',
  },
  {
    title: '有人和我一样喜欢一个人看电影吗？',
    body: '朋友都觉得我奇怪，但我真的很享受一个人看电影的感觉。想看什么看什么，想吃什么吃什么，不用迁就别人的时间。难道我是异类？',
    board: '日常',
  },
  {
    title: '女朋友生气了，我该怎么哄？',
    body: '昨天她问我"我和你妈同时掉水里你救谁"，我说"都救"。结果她更生气了，说我敷衍。我真的不知道该怎么回答这种问题啊！兄弟们救救我！',
    board: '求助',
  },
  {
    title: '分享一个超好笑的梦',
    body: '梦见自己变成了一只猫，然后被我自己养着。梦里的我给猫（也就是我自己）铲屎，猫还嫌弃地看着我。醒来之后笑了半天哈哈哈。',
    board: '故事',
  },
];

/**
 * 生成预制评论
 */
export const COMMENT_TEMPLATES = [
  '哈哈哈笑死我了',
  '同感！我也遇到过',
  '楼主说得对',
  '有道理',
  '这也太真实了吧',
  '支持楼主！',
  '感同身受',
  '我也是这么想的',
  '正解',
  '666',
  '绝了',
  '哈哈哈哈哈',
  '笑不活了',
  '好家伙',
  '离谱',
  '这波操作可以',
  '心疼楼主',
  '建议直接分手（狗头）',
  '典',
  '懂了',
  '学到了',
  '马了',
  '收藏了',
  '顶',
  '沙发',
  '前排',
  '路过',
  '围观',
  '吃瓜',
  '坐等后续',
  '同款',
  '我朋友也这样',
  '正常现象',
  '习惯就好',
  '不是吧',
  '太惨了',
  '笑得我肚子疼',
  '这是什么人间疾苦',
  '建议多说点（狗头）',
  '已笑',
];
