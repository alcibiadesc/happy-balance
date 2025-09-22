UPDATE transactions SET "categoryId" = (SELECT id FROM categories WHERE name = 'Plan de pensiones' AND type = 'investment' LIMIT 1) WHERE merchant LIKE '%MAPFRE%' AND amount = 125;
