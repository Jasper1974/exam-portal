import { createPrismaClient } from "../src/lib/db/create-client";

const prisma = createPrismaClient();

type ChoiceOption = {
  key: string;
  label: string;
};

const SAMPLE_EXAM = {
  slug: "final-2026",
  title: "2025-2026 学年第一学期期末考试",
  description:
    "请认真作答。选择题自动判分，简答题由 AI 辅助评分，最终成绩以教师复核为准。",
  durationMinutes: 90,
  isPublished: true,
  questions: [
    {
      orderIndex: 1,
      type: "single",
      stem: "以下哪一项最能体现「平台只做导航、不参与药品交易」的合规定位？",
      options: [
        { key: "A", label: "平台自建仓库直接发货" },
        { key: "B", label: "导流至京东大药房/阿里健康等合作平台" },
        { key: "C", label: "平台代患者议价并收取药款" },
        { key: "D", label: "平台提供在线处方并销售处方药" },
      ] satisfies ChoiceOption[],
      correctAnswer: "B",
      maxScore: 10,
    },
    {
      orderIndex: 2,
      type: "multiple",
      stem: "浏览模式（browse）下，平台不应向未审核用户展示哪些内容？（多选）",
      options: [
        { key: "A", label: "「您适合…」类个性化表述" },
        { key: "B", label: "公开临床试验列表" },
        { key: "C", label: "匹配度/可行性评分" },
        { key: "D", label: "慈善赠药公开项目列表" },
      ] satisfies ChoiceOption[],
      correctAnswer: ["A", "C"],
      maxScore: 15,
    },
    {
      orderIndex: 3,
      type: "single",
      stem: "学生端部署考试时，为何建议大模型 API 放在服务端而非浏览器直连？",
      options: [
        { key: "A", label: "前端无法写 CSS" },
        { key: "B", label: "避免泄露密钥，并便于切换智谱/Claude" },
        { key: "C", label: "浏览器禁止调用 HTTPS" },
        { key: "D", label: "服务端无法访问国产模型" },
      ] satisfies ChoiceOption[],
      correctAnswer: "B",
      maxScore: 10,
    },
    {
      orderIndex: 4,
      type: "text",
      stem: "请用 80–150 字说明：重症患者全球用药导航平台中，「先浏览、再深服务」用户路径的设计理由。",
      correctAnswer: null,
      maxScore: 25,
      rubric:
        "应提到降低疑虑、先建立信任、公开资料浏览、强需求产生后再引导企微/上传资料；表述清楚即可满分。",
    },
    {
      orderIndex: 5,
      type: "text",
      stem: "请列举期末考试系统中，学号字段的格式要求，并说明为何需要绑定姓名与学号。",
      correctAnswer: null,
      maxScore: 20,
      rubric:
        "学号为 12 位数字；需唯一标识考生、防止代考、便于成绩归档与查询。答出要点即可给分。",
    },
  ],
};

async function main() {
  await prisma.exam.upsert({
    where: { slug: SAMPLE_EXAM.slug },
    update: {
      title: SAMPLE_EXAM.title,
      description: SAMPLE_EXAM.description,
      durationMinutes: SAMPLE_EXAM.durationMinutes,
      isPublished: SAMPLE_EXAM.isPublished,
    },
    create: {
      slug: SAMPLE_EXAM.slug,
      title: SAMPLE_EXAM.title,
      description: SAMPLE_EXAM.description,
      durationMinutes: SAMPLE_EXAM.durationMinutes,
      isPublished: SAMPLE_EXAM.isPublished,
    },
  });

  const exam = await prisma.exam.findUniqueOrThrow({
    where: { slug: SAMPLE_EXAM.slug },
  });

  await prisma.question.deleteMany({ where: { examId: exam.id } });

  for (const q of SAMPLE_EXAM.questions) {
    await prisma.question.create({
      data: {
        examId: exam.id,
        orderIndex: q.orderIndex,
        type: q.type,
        stem: q.stem,
        options: q.options,
        correctAnswer: q.correctAnswer,
        maxScore: q.maxScore,
        rubric: "rubric" in q ? q.rubric : null,
      },
    });
  }

  console.log(`Seeded exam: ${SAMPLE_EXAM.title} (${SAMPLE_EXAM.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
