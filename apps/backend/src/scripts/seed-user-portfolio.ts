import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * User's real portfolio data imported from external system
 */
const userPortfolio = [
  {
    id: '83733f58-47bc-4f95-8e62-a41b92d0d198',
    name: 'Fondos de Inversión',
    currentValue: 252000,
    highlight: true,
    color: '#10B981',
    icon: '📊',
    symbol: 'FONDOS',
    notes: 'Cartera principal de fondos de inversión',
    savings: [
      { id: 'f7702902-9673-49fe-ba99-6571d27839bb', date: '2025-11-30', amount: 4000 },
      { id: 'f5bb81ef-dfc1-46c1-a4de-fa0709b16e3a', date: '2025-10-30', amount: 4000 },
      { id: '35141e7c-cf51-4f25-a54c-cc4e18059e55', date: '2025-10-01', amount: 4000 },
      { id: '734fa77c-b5a2-419c-a7fb-80e5f856f92f', date: '2025-08-11', amount: 1300 },
      { id: 'bb2e75c4-440f-48e9-867f-a7b9b0e96f60', date: '2025-07-30', amount: 4000 },
      { id: '1af68a82-7975-43a9-80bf-60598e061e40', date: '2025-07-08', amount: 2000 },
      { id: '80a2ecf2-a198-44e3-8dde-72986bed9c42', date: '2025-07-01', amount: 4000 },
      { id: '64fe2536-853d-45d0-a719-ca1464dd62d0', date: '2025-06-24', amount: 5400 },
      { id: '9a2b472d-4d5d-47a6-8cb0-d526154c744f', date: '2025-06-05', amount: 32999 },
      { id: 'ae3c491a-0ecb-4b89-8cab-15b502ce0ebe', date: '2025-05-05', amount: 25000 },
      { id: 'e3951a83-9e36-4098-a9e6-8247f1ed774b', date: '2023-12-24', amount: 16000 },
      { id: 'ffe847d9-92ad-41dc-afe6-77b3cbcfbb1c', date: '2023-07-27', amount: 2000 },
      { id: '031d6c43-164b-4f5c-9d53-b7c38bd4336a', date: '2023-07-07', amount: -2000 },
      { id: '9376a64e-f288-457a-af20-2095a77c33a4', date: '2023-06-04', amount: 2000 },
      { id: 'a7470c43-a854-4518-a857-b3c111ca9139', date: '2023-05-08', amount: 2000 },
      { id: '42a36609-ef33-4977-a76f-187d50237cad', date: '2023-04-07', amount: 1000 },
      { id: '9bf498d2-a91d-4ba9-820e-01063af46df7', date: '2023-03-07', amount: 1000 },
      { id: 'c364d15f-5279-4709-b974-76147fb839b3', date: '2023-02-13', amount: -2590 },
      { id: '5fac1f27-ff0c-4201-a917-2d8db5f4124e', date: '2023-01-30', amount: 2000 },
      { id: '0b5cbe13-b823-4cc0-a740-c1d9b0689bca', date: '2022-12-28', amount: 2000 },
      { id: '40a980eb-1d4e-4ad1-8204-5eaafdc3bb1e', date: '2022-11-28', amount: 2000 },
      { id: '6ebc140b-a586-4d02-be49-bfb54c354f48', date: '2022-10-29', amount: 2000 },
      { id: '5a5c3f2c-535a-415e-9a97-7ab024f0aa98', date: '2022-10-04', amount: 1836.04 },
      { id: 'afdd8c63-a2dc-49e2-b0f3-992bbc3fd27d', date: '2022-10-02', amount: 400 },
      { id: '1cfb8c41-b632-45d4-b03f-94a11369c36c', date: '2022-09-28', amount: 2000 },
      { id: '5bbe02da-f9a8-41ee-a8a3-d3724286ef25', date: '2022-08-29', amount: 2000 },
      { id: 'e2f9fe70-717f-4e18-89ae-97fcbf8a2395', date: '2022-08-08', amount: 4219.35 },
      { id: '1a55e521-c1b1-4e72-843b-f5a4d8b988a5', date: '2022-08-01', amount: 381 },
      { id: '8bcf2c5a-30f7-4357-890a-2c8a3d8f984b', date: '2022-07-29', amount: 2000 },
      { id: '66547e60-d7ff-4701-9f93-c71e9ec5ed3a', date: '2022-07-22', amount: 905.25 },
      { id: '6629e85a-eb63-4ef2-92d9-7b7579ddda32', date: '2022-07-06', amount: 3611.86 },
      { id: 'aafe3a59-4dec-49b1-b3a4-c5e5cd8b3aac', date: '2022-06-28', amount: 2000 },
      { id: 'c6d64437-c6d3-4473-87cc-3dcf0c41d61c', date: '2022-06-07', amount: 812.05 },
      { id: '5cd5b2c9-e8f7-4b1a-8ef9-caa148242f03', date: '2022-05-30', amount: 2000 },
      { id: '1bb51f78-a89d-48a4-b112-986dd10fff18', date: '2022-05-08', amount: 2005.11 },
      { id: '41ed9e90-1804-43e4-b1e3-87a81788cd18', date: '2022-04-29', amount: 2000 },
      { id: '27281e76-e620-4b2b-ab56-fa3396efa5c4', date: '2022-03-29', amount: 2000 },
      { id: 'c2b3fb3f-1d16-48fe-baf9-ad58f2082f79', date: '2022-03-01', amount: 100 },
      { id: 'd4066f3e-315e-4cf0-9db5-ddaf3ee2918f', date: '2022-02-28', amount: 767.71 },
      { id: 'f61839ea-af30-4b0c-bf7d-95f98bb9e10c', date: '2022-02-28', amount: 2000 },
      { id: 'fcf6806b-9f55-4411-8734-dec0195d2fdf', date: '2022-02-15', amount: 6600 },
      { id: '9f9edd09-9ce1-4d52-a60e-b9e88ca59d05', date: '2022-02-07', amount: 368.75 },
      { id: '239323b0-3fea-4a23-acf6-95f84691e48e', date: '2022-02-07', amount: 500 },
      { id: '4788f098-095c-4559-a201-6558d4e2c2e7', date: '2022-01-31', amount: 2000 },
      { id: 'fe96975b-e9ec-4212-824c-8867e16431d9', date: '2022-01-31', amount: 1593.88 },
      { id: '079dce96-1eca-44ff-a81a-e1023853ad4e', date: '2021-12-29', amount: 1300 },
      { id: '60fb97ed-a634-4ec6-9e22-7c9eeddfcd31', date: '2021-10-26', amount: 1300 },
      { id: '6e5993e3-344c-479a-ae01-7ec610eff224', date: '2021-09-27', amount: 1300 },
      { id: 'ffb8e538-fd47-41eb-a2a4-0a0ff19b93f7', date: '2021-08-26', amount: 1300 },
      { id: '1c164105-10f1-49cb-8518-53ad5f8d2ee9', date: '2021-07-26', amount: 1800 },
      { id: 'c5f4b680-9fcf-41a0-97a7-481958ace8b0', date: '2021-06-28', amount: 1800 },
      { id: 'a1dacd74-0e24-4970-a232-a7cfd64dd70d', date: '2021-05-01', amount: 1800 },
      { id: '1efcb81e-52d9-4d03-bf23-f804410c66cd', date: '2021-04-01', amount: -1188 },
      { id: 'f3af0f0c-69bd-43cc-8b21-70a2caad40a5', date: '2021-03-01', amount: -1200 },
      { id: 'c884ca2e-dbad-4cc6-afc3-c2a016297279', date: '2021-02-01', amount: 1800 },
      { id: 'bb5de343-e113-4572-82f0-8e100f0a727f', date: '2021-01-01', amount: 5363.75 },
      { id: '4e1016f8-f125-45c4-9345-8af974d331ef', date: '2020-12-01', amount: 2209.5 },
      { id: 'fb4759b0-2608-40e4-8033-df60996abe74', date: '2020-11-01', amount: 1424.96 },
      { id: '69c069de-c53b-471a-a906-9f9ce59a8836', date: '2020-10-01', amount: 3273.97 },
      { id: '37d64232-09a8-412e-bbf4-eb28c8927237', date: '2020-09-01', amount: 1637.98 },
      { id: '5a1cc847-f696-414f-828a-2f009852e1fa', date: '2020-08-01', amount: 1560.61 },
      { id: '40d97873-8e40-4126-becf-5ea2e1fc2d82', date: '2020-07-01', amount: 1391.31 },
      { id: '610316b1-4e55-49aa-a706-8e937e0ce951', date: '2020-06-27', amount: 1477.24 },
      { id: 'f935efb5-d4c4-4bed-85a2-4b703795ff20', date: '2020-05-01', amount: 1000 },
      { id: 'f9cf6c25-dd6f-4956-9353-d08fcae41cad', date: '2020-04-01', amount: 1000 },
      { id: '20789343-110a-48cb-b2be-e4d0ba50fb24', date: '2020-03-01', amount: 3612 },
      { id: '47c95331-82bf-4e37-a457-8d90905c5b7d', date: '2020-02-01', amount: 1428.57 },
      { id: 'ee15d06b-7a8d-4e3f-9294-ca59ffaee938', date: '2020-01-01', amount: 2625 },
      { id: '3aa5f2dd-d4e5-4730-914d-f9d4fa82691e', date: '2019-09-10', amount: 19837.69 },
    ],
  },
  {
    id: '410d57ab-773f-4a7d-9ffe-55ea98944b33',
    name: 'Plan de Pensiones',
    currentValue: 36000,
    highlight: false,
    color: '#EC4899',
    icon: '👴',
    symbol: 'PP',
    notes: 'Plan de pensiones - Aportaciones periódicas',
    savings: [
      { id: '538b4812-1f07-40f3-8fdd-7bf91b02d8d1', date: '2025-11-10', amount: 125 },
      { id: '29335a18-1ec9-4e14-a3a8-39a107705c8b', date: '2025-10-06', amount: 125 },
      { id: '0590d93d-3954-4121-953e-0c367deab63b', date: '2025-09-08', amount: 125 },
      { id: '9a115d18-d65c-4fbc-bb92-dce03cce0f94', date: '2025-08-06', amount: 125 },
      { id: '811a8890-22d0-4bca-a048-4994be6d5424', date: '2025-07-09', amount: 125 },
      { id: '38678368-c4b0-48de-b492-663bb38deeed', date: '2025-06-06', amount: 125 },
      { id: 'cb66f66c-0014-455d-97ec-26a04d48d8b8', date: '2025-05-06', amount: 125 },
      { id: '207d44bf-09e9-4af2-aba5-d32d6352e679', date: '2025-04-09', amount: 125 },
      { id: '2ee77366-5a21-4310-9152-f29297650fa6', date: '2025-03-05', amount: 125 },
      { id: '090825fc-bae6-44b1-80e5-606a316f97d2', date: '2025-02-11', amount: 125 },
      { id: '419e025e-fe49-4546-9e46-c942632afb18', date: '2025-01-10', amount: 125 },
      { id: 'bade5fbf-4d74-43e7-947e-ec8f4caec70e', date: '2024-12-10', amount: 125 },
      { id: 'ac54cf59-2487-41b1-92b7-9a7a674cec9e', date: '2024-11-06', amount: 125 },
      { id: 'cfe68e88-feef-4e0a-91c7-b6cbf5e3b770', date: '2024-10-07', amount: 125 },
      { id: '82c6e632-cb7d-491d-8612-39db1a1b51dd', date: '2024-09-09', amount: 125 },
      { id: '6f4b35fd-cd9d-49e3-9235-849a0431c382', date: '2024-08-12', amount: 125 },
      { id: '1c387eba-cf76-47b7-a249-fb2af309b629', date: '2024-07-15', amount: 125 },
      { id: '94956b31-d1f8-4f91-b836-c394908b6b6f', date: '2024-06-11', amount: 125 },
      { id: '3acedaab-5644-4cc6-b3bf-42649c928503', date: '2024-05-14', amount: 125 },
      { id: '5f6df0bf-4d71-4ea5-9f8a-69089c3b7bc9', date: '2024-04-16', amount: 125 },
      { id: 'a4663e13-ff5a-4d4c-85bf-b5888f1700c3', date: '2024-03-12', amount: 125 },
      { id: '01bcf1cc-dff4-4a4e-b51c-e1083a2dd93e', date: '2024-02-11', amount: 125 },
      { id: '44b3982c-fc90-4f51-8f75-a2961b29c50a', date: '2024-01-08', amount: 125 },
      { id: '76d8f6f7-1f10-43bc-b381-8d5236650d82', date: '2023-12-09', amount: 125 },
      { id: 'a3b1503d-9b80-4788-aa9c-ad35d65f97f7', date: '2023-11-07', amount: 125 },
      { id: '3a3308c4-9409-487c-9b95-d1c3598c210d', date: '2023-10-08', amount: 125 },
      { id: '84956f38-1146-4c2b-a742-1c6993cc8642', date: '2023-09-06', amount: 125 },
      { id: 'bfde8e83-d46f-49d1-8194-642a5c82b7e8', date: '2023-08-08', amount: 125 },
      { id: '7d9e8453-45af-429f-92ee-6796ee957c43', date: '2023-07-06', amount: 125 },
      { id: '4d879a0c-871a-48b0-a638-14011d45f709', date: '2023-06-04', amount: 125 },
      { id: '2958ff8c-c498-4c9e-b7ec-1e7ab270eb90', date: '2023-05-08', amount: 125 },
      { id: '15bb64bb-b335-447c-a588-5221c60074ff', date: '2023-04-07', amount: 125 },
      { id: '3bf5d1bc-b7a5-466c-afc4-eb7d97b70787', date: '2023-03-07', amount: 125 },
      { id: 'fdb8f996-72fc-4075-8b7d-7031b1ad5d97', date: '2023-02-07', amount: 125 },
      { id: '040f561e-054e-4a9b-b2d9-7c32b942105e', date: '2023-01-09', amount: 125 },
      { id: '9bc738dd-2a69-41f9-90d3-312239a5257c', date: '2022-12-07', amount: 125 },
      { id: 'c206d991-3a84-4be3-9f56-61ba87bd1cfe', date: '2022-11-08', amount: 125 },
      { id: '7e706d36-f6f2-427f-8e5f-8caa9607de22', date: '2022-10-06', amount: 125 },
      { id: 'a0890770-a862-49ed-b9fd-af5cd4726c35', date: '2022-09-06', amount: 125 },
      { id: 'a4245c67-b752-4f18-b8ee-9ee882cdfa89', date: '2022-08-08', amount: 125 },
      { id: '09aba549-3761-4ced-b33e-0ba885a0aa37', date: '2022-07-05', amount: 125 },
      { id: '6e9e8c0b-38cc-4f9f-a7ae-22fef430ce5b', date: '2022-06-05', amount: 125 },
      { id: '42262f5a-acba-4f73-860e-1a06880c294e', date: '2022-05-06', amount: 125 },
      { id: 'def5ba95-25f3-409e-89ea-bcf197994209', date: '2022-04-07', amount: 125 },
      { id: 'efe4068b-cb65-4828-b275-d305013d651f', date: '2022-03-09', amount: 125 },
      { id: '0b324f2a-a023-4254-9e97-90a75378d495', date: '2022-02-08', amount: 125 },
      { id: '5505ea1e-b72a-4b6e-bad2-53255c753aa9', date: '2022-01-07', amount: 125 },
      { id: '1be46a26-8704-43bd-9f82-65148575fdfc', date: '2021-01-31', amount: 2000 },
      { id: '464c3c64-e68c-4072-b970-74563c25d3b6', date: '2020-12-01', amount: 666.65 },
      { id: '0cea3565-7fdd-4116-b7bf-4855d728ea26', date: '2020-11-01', amount: 666.65 },
      { id: '856c4032-0eac-49b8-866e-84f430cea69d', date: '2020-10-01', amount: 666.65 },
      { id: '659da07c-5477-4022-aca5-edc1249e73f1', date: '2020-09-01', amount: 666.65 },
      { id: '65587017-c728-4c46-a92c-e4b163629b26', date: '2020-08-01', amount: 666.65 },
      { id: 'a93e7df7-f788-432e-9cdd-36555c99841d', date: '2020-07-01', amount: 666.65 },
      { id: 'dbc79748-fe45-4b90-a238-d91b9deb4a88', date: '2020-06-01', amount: 666.65 },
      { id: '9c22ffa7-756f-4c8b-8d2b-cbb0c61b49fa', date: '2020-05-01', amount: 666.65 },
      { id: '357e96b7-3888-4047-b929-1ea4cb60035f', date: '2020-04-01', amount: 666.65 },
      { id: '7d276e8d-252c-445e-82fd-bdd83b5de02e', date: '2020-03-01', amount: 666.65 },
      { id: '95aa58dc-0cc6-4a5c-904f-24c087b951d6', date: '2020-02-01', amount: 666.65 },
      { id: 'b91037fa-8d91-41ab-9bb4-f79256c4ab38', date: '2020-01-01', amount: 666.65 },
      { id: 'baa75a21-100f-4788-9ca2-0d954f56fd07', date: '2019-12-01', amount: 2000 },
      { id: '13bd26c0-4b08-4865-9e7d-bf75cbc12263', date: '2019-11-01', amount: 2000 },
      { id: '3de0f306-5de4-4f8e-82f7-be2e7837eeca', date: '2019-10-01', amount: 2000 },
      { id: '02297961-ed71-49e0-96cf-9c5fc1f86294', date: '2019-09-01', amount: 2000 },
    ],
  },
  {
    id: '864cf6ad-fb28-4aee-815d-26a7d4b62bf6',
    name: 'Crypto',
    currentValue: 3000,
    highlight: false,
    color: '#F59E0B',
    icon: '₿',
    symbol: 'CRYPTO',
    notes: 'Criptomonedas - Bitcoin, Ethereum, etc.',
    savings: [
      { id: 'a0a9f2f7-3af0-427e-b46d-8af418db433d', date: '2025-11-20', amount: 1000 },
      { id: 'ad455992-ce2a-47bb-84ef-b2115626d666', date: '2025-11-13', amount: 400 },
      { id: '1515b249-af0f-429f-8f8e-c1aeef11f302', date: '2025-11-05', amount: 510 },
      { id: '9bc3a67f-78d6-444b-820b-addf988dc200', date: '2025-10-19', amount: 1000 },
      { id: '4ce1ea4b-ccf4-4580-aaeb-a47b2c408476', date: '2025-10-05', amount: 509.93 },
    ],
  },
  {
    id: 'f2359057-3937-417f-b47a-448eeebe6be7',
    name: 'Crescenta',
    currentValue: 4850,
    highlight: false,
    color: '#8B5CF6',
    icon: '🏢',
    symbol: 'CRESCENTA',
    notes: 'Inversión en Crescenta - Private Equity',
    savings: [
      { id: 'd760fb02-dcdc-45db-b874-e69c9ae34bc4', date: '2025-07-20', amount: -150 },
      { id: 'b73f9f4c-5365-4af6-b166-02cf38b714b2', date: '2025-05-18', amount: 2400 },
      { id: 'e4f06faa-6ada-49c4-937f-931dcc0a7f59', date: '2025-05-05', amount: 2600 },
    ],
  },
  {
    id: 'c93891f8-c7c9-4d1b-91b9-ecf6245d8605',
    name: 'Colchón',
    currentValue: 10000,
    highlight: false,
    color: '#14B8A6',
    icon: '🛡️',
    symbol: 'CASH',
    notes: 'Fondo de emergencia - Colchón de seguridad',
    savings: [],
  },
];

/**
 * Import user portfolio into the database
 */
async function seedUserPortfolio(userId: string): Promise<void> {
  console.log(`\n🌱 Importing portfolio for user: ${userId}\n`);

  let totalInvestments = 0;
  let totalHistoryEntries = 0;

  for (let i = 0; i < userPortfolio.length; i++) {
    const inv = userPortfolio[i];

    console.log(`  📈 Creating: ${inv.name}`);

    // Check if investment already exists
    const existing = await prisma.investment.findUnique({
      where: { id: inv.id },
    });

    if (existing) {
      console.log(`     ⚠️  Already exists, skipping...`);
      continue;
    }

    // Create investment
    await prisma.investment.create({
      data: {
        id: inv.id,
        name: inv.name,
        symbol: inv.symbol,
        currentValue: inv.currentValue,
        currency: 'EUR',
        highlight: inv.highlight,
        color: inv.color,
        icon: inv.icon,
        notes: inv.notes,
        isActive: true,
        sortOrder: i,
        userId: userId,
      },
    });

    totalInvestments++;

    // Create history entries
    for (const saving of inv.savings) {
      const type = saving.amount >= 0 ? 'CONTRIBUTION' : 'WITHDRAWAL';
      const amount = Math.abs(saving.amount);

      await prisma.investmentHistory.create({
        data: {
          id: saving.id,
          investmentId: inv.id,
          amount: amount,
          type: type,
          date: new Date(saving.date),
          notes: type === 'WITHDRAWAL' ? 'Retirada' : 'Aportación',
        },
      });

      totalHistoryEntries++;
    }

    // Calculate totals for this investment
    const contributions = inv.savings.filter(s => s.amount > 0).reduce((sum, s) => sum + s.amount, 0);
    const withdrawals = inv.savings.filter(s => s.amount < 0).reduce((sum, s) => sum + Math.abs(s.amount), 0);
    const net = contributions - withdrawals;

    console.log(`     ✅ Created with ${inv.savings.length} history entries`);
    console.log(`        Contributions: €${contributions.toLocaleString('es-ES')}`);
    if (withdrawals > 0) {
      console.log(`        Withdrawals: €${withdrawals.toLocaleString('es-ES')}`);
    }
    console.log(`        Net invested: €${net.toLocaleString('es-ES')}`);
    console.log(`        Current value: €${inv.currentValue.toLocaleString('es-ES')}`);
  }

  return { totalInvestments, totalHistoryEntries } as any;
}

/**
 * Main seed function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting user portfolio import...');
  console.log('═'.repeat(50));

  try {
    // Get admin user (or first user)
    const user = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!user) {
      console.log('\n❌ No admin user found. Please run seed-admin first.');
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.username} (${user.id})`);

    // Seed portfolio
    await seedUserPortfolio(user.id);

    // Summary
    const totalInvestments = await prisma.investment.count({
      where: { userId: user.id },
    });
    const totalHistory = await prisma.investmentHistory.count({
      where: { investment: { userId: user.id } },
    });

    const summary = await prisma.investment.aggregate({
      where: { userId: user.id, isActive: true },
      _sum: { currentValue: true },
    });

    console.log('\n' + '═'.repeat(50));
    console.log('📊 Import Summary:');
    console.log('═'.repeat(50));
    console.log(`   Investments: ${totalInvestments}`);
    console.log(`   History entries: ${totalHistory}`);
    console.log(`   Total portfolio value: €${Number(summary._sum.currentValue || 0).toLocaleString('es-ES')}`);

    console.log('\n🎉 Portfolio import completed successfully!');

  } catch (error) {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main();
