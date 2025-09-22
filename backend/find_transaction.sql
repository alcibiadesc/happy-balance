SELECT id, amount, type, merchant, description, observations FROM transactions WHERE description LIKE '%157.872.110%' OR merchant LIKE '%MAPFRE%' OR observations LIKE '%157.872.110%';
