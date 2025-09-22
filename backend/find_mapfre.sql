SELECT id, amount, type, merchant, description, observations FROM transactions WHERE merchant LIKE '%MAPFRE%' OR description LIKE '%MAPFRE%' OR observations LIKE '%MAPFRE%';
