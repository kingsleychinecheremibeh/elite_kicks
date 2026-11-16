// Club catalogue. Colours are each club's traditional colours; shirts are rendered
// procedurally (no crests, sponsors or official artwork).
// [slug, name, league, country, homePattern, [primary, secondary, accent], away?]
// away = [pattern, [primary, secondary, accent]]

const PL = 'Premier League', LL = 'La Liga', SA = 'Serie A', BL = 'Bundesliga',
  L1 = 'Ligue 1', ED = 'Eredivisie', LP = 'Liga Portugal', NP = 'NPFL',
  SPL = 'Saudi Pro League', MLS = 'MLS', BR = 'Brasileirão', INT = 'International';

export const CLUBS = [
  // Premier League
  ['arsenal', 'Arsenal', PL, 'England', 'sleeves', ['#DB0007', '#FFFFFF', '#063672'], ['solid', ['#F2E8C9', '#1B3A6B', '#C8102E']]],
  ['chelsea', 'Chelsea', PL, 'England', 'solid', ['#034694', '#FFFFFF', '#DBA111'], ['solid', ['#F4F1E8', '#034694', '#DBA111']]],
  ['liverpool', 'Liverpool', PL, 'England', 'solid', ['#C8102E', '#F6EB61', '#00B2A9'], ['solid', ['#FFFFFF', '#C8102E', '#1D1D1B']]],
  ['man-city', 'Manchester City', PL, 'England', 'solid', ['#6CABDD', '#FFFFFF', '#1C2C5B'], ['gradient', ['#1C2C5B', '#6CABDD', '#FFFFFF']]],
  ['man-united', 'Manchester United', PL, 'England', 'solid', ['#DA291C', '#FFFFFF', '#000000'], ['solid', ['#F5F5F0', '#000000', '#DA291C']]],
  ['tottenham', 'Tottenham Hotspur', PL, 'England', 'solid', ['#FFFFFF', '#132257', '#132257'], ['solid', ['#132257', '#FFFFFF', '#7CA6D6']]],
  ['newcastle', 'Newcastle United', PL, 'England', 'stripes', ['#241F20', '#FFFFFF', '#41B6E6']],
  ['aston-villa', 'Aston Villa', PL, 'England', 'sleeves', ['#670E36', '#95BFE5', '#FEE505']],
  ['everton', 'Everton', PL, 'England', 'solid', ['#003399', '#FFFFFF', '#FFFFFF']],
  ['west-ham', 'West Ham United', PL, 'England', 'sleeves', ['#7A263A', '#1BB1E7', '#F3D459']],
  // La Liga
  ['real-madrid', 'Real Madrid', LL, 'Spain', 'solid', ['#FFFFFF', '#00529F', '#FEBE10'], ['solid', ['#1B1B2F', '#FEBE10', '#FFFFFF']]],
  ['barcelona', 'FC Barcelona', LL, 'Spain', 'stripes', ['#A50044', '#004D98', '#EDBB00'], ['solid', ['#EDBB00', '#A50044', '#004D98']]],
  ['atletico', 'Atlético Madrid', LL, 'Spain', 'stripes', ['#CB3524', '#FFFFFF', '#272E61'], ['solid', ['#272E61', '#CB3524', '#FFFFFF']]],
  ['sevilla', 'Sevilla FC', LL, 'Spain', 'solid', ['#FFFFFF', '#D71920', '#D71920']],
  ['valencia', 'Valencia CF', LL, 'Spain', 'solid', ['#FFFFFF', '#000000', '#EE3524']],
  ['real-betis', 'Real Betis', LL, 'Spain', 'stripes', ['#00954C', '#FFFFFF', '#FFFFFF']],
  // Serie A
  ['juventus', 'Juventus', SA, 'Italy', 'stripes', ['#111111', '#FFFFFF', '#D4AF37'], ['solid', ['#F2C94C', '#111111', '#111111']]],
  ['ac-milan', 'AC Milan', SA, 'Italy', 'stripes', ['#FB090B', '#111111', '#FFFFFF'], ['solid', ['#FFFFFF', '#FB090B', '#111111']]],
  ['inter', 'Inter', SA, 'Italy', 'stripes', ['#010E80', '#111111', '#D4AF37'], ['solid', ['#FFFFFF', '#010E80', '#D4AF37']]],
  ['napoli', 'Napoli', SA, 'Italy', 'solid', ['#12A0D7', '#FFFFFF', '#003C82']],
  ['roma', 'AS Roma', SA, 'Italy', 'solid', ['#8E1F2F', '#F0BC42', '#F0BC42']],
  ['lazio', 'Lazio', SA, 'Italy', 'solid', ['#87D8F7', '#FFFFFF', '#15366F']],
  // Bundesliga
  ['bayern', 'Bayern Munich', BL, 'Germany', 'solid', ['#DC052D', '#FFFFFF', '#0066B2'], ['solid', ['#FFFFFF', '#DC052D', '#0066B2']]],
  ['dortmund', 'Borussia Dortmund', BL, 'Germany', 'solid', ['#FDE100', '#000000', '#000000'], ['solid', ['#111111', '#FDE100', '#FDE100']]],
  ['leverkusen', 'Bayer Leverkusen', BL, 'Germany', 'solid', ['#E32221', '#000000', '#F3E500']],
  ['leipzig', 'RB Leipzig', BL, 'Germany', 'solid', ['#FFFFFF', '#DD0741', '#001F47']],
  ['frankfurt', 'Eintracht Frankfurt', BL, 'Germany', 'solid', ['#111111', '#E1000F', '#FFFFFF']],
  // Ligue 1
  ['psg', 'Paris Saint-Germain', L1, 'France', 'halves', ['#004170', '#DA291C', '#FFFFFF'], ['solid', ['#FFFFFF', '#004170', '#DA291C']]],
  ['marseille', 'Olympique de Marseille', L1, 'France', 'solid', ['#FFFFFF', '#2FAEE0', '#2FAEE0']],
  ['lyon', 'Olympique Lyonnais', L1, 'France', 'solid', ['#FFFFFF', '#14387F', '#DA0812']],
  ['monaco', 'AS Monaco', L1, 'France', 'sash', ['#FFFFFF', '#E7232E', '#E7232E']],
  // Eredivisie / Portugal
  ['ajax', 'Ajax', ED, 'Netherlands', 'halves', ['#FFFFFF', '#D2122E', '#D2122E']],
  ['psv', 'PSV Eindhoven', ED, 'Netherlands', 'stripes', ['#ED1C24', '#FFFFFF', '#111111']],
  ['benfica', 'Benfica', LP, 'Portugal', 'solid', ['#E83030', '#FFFFFF', '#FFFFFF']],
  ['porto', 'FC Porto', LP, 'Portugal', 'stripes', ['#00428C', '#FFFFFF', '#FFFFFF']],
  // NPFL (Nigeria)
  ['enyimba', 'Enyimba FC', NP, 'Nigeria', 'solid', ['#0B6E3A', '#FFFFFF', '#F5C518'], ['solid', ['#FFFFFF', '#0B6E3A', '#F5C518']]],
  ['rangers-intl', 'Rangers International', NP, 'Nigeria', 'solid', ['#C8102E', '#FFFFFF', '#FFFFFF'], ['solid', ['#FFFFFF', '#C8102E', '#C8102E']]],
  ['kano-pillars', 'Kano Pillars', NP, 'Nigeria', 'sleeves', ['#F5C518', '#0B6E3A', '#0B6E3A']],
  ['rivers-united', 'Rivers United', NP, 'Nigeria', 'solid', ['#1E4FA1', '#FFFFFF', '#F5C518']],
  ['shooting-stars', 'Shooting Stars', NP, 'Nigeria', 'gradient', ['#0E3B8C', '#FFFFFF', '#E10600']],
  ['remo-stars', 'Remo Stars', NP, 'Nigeria', 'sash', ['#003DA5', '#FFFFFF', '#FFFFFF']],
  // Saudi / MLS / Brazil
  ['al-nassr', 'Al Nassr', SPL, 'Saudi Arabia', 'solid', ['#FCE300', '#1E3A8A', '#1E3A8A']],
  ['al-hilal', 'Al Hilal', SPL, 'Saudi Arabia', 'solid', ['#1F4AA8', '#FFFFFF', '#FFFFFF']],
  ['inter-miami', 'Inter Miami', MLS, 'USA', 'solid', ['#F7B5CD', '#231F20', '#231F20'], ['solid', ['#231F20', '#F7B5CD', '#F7B5CD']]],
  ['la-galaxy', 'LA Galaxy', MLS, 'USA', 'sash', ['#FFFFFF', '#00245D', '#FFD200']],
  ['flamengo', 'Flamengo', BR, 'Brazil', 'hoops', ['#C52613', '#111111', '#FFFFFF']],
  ['santos', 'Santos', BR, 'Brazil', 'solid', ['#FFFFFF', '#111111', '#111111']],
  // National teams
  ['nigeria', 'Nigeria', INT, 'Nigeria', 'gradient', ['#008751', '#FFFFFF', '#00B36B'], ['solid', ['#FFFFFF', '#008751', '#008751']], true],
  ['ghana', 'Ghana', INT, 'Ghana', 'solid', ['#FFFFFF', '#111111', '#FCD116'], null, true],
  ['senegal', 'Senegal', INT, 'Senegal', 'solid', ['#FFFFFF', '#00853F', '#FDEF42'], null, true],
  ['cameroon', 'Cameroon', INT, 'Cameroon', 'solid', ['#007A5E', '#CE1126', '#FCD116'], null, true],
  ['morocco', 'Morocco', INT, 'Morocco', 'solid', ['#C1272D', '#006233', '#FFFFFF'], null, true],
  ['brazil', 'Brazil', INT, 'Brazil', 'solid', ['#FFDC02', '#009C3B', '#002776'], ['solid', ['#002776', '#FFDC02', '#FFFFFF']], true],
  ['argentina', 'Argentina', INT, 'Argentina', 'stripes', ['#75AADB', '#FFFFFF', '#111111'], ['solid', ['#111111', '#75AADB', '#FFFFFF']], true],
  ['france', 'France', INT, 'France', 'solid', ['#002654', '#FFFFFF', '#ED2939'], null, true],
  ['england', 'England', INT, 'England', 'solid', ['#FFFFFF', '#00247D', '#CF142B'], null, true],
  ['germany', 'Germany', INT, 'Germany', 'solid', ['#FFFFFF', '#111111', '#DD0000'], null, true],
  ['spain', 'Spain', INT, 'Spain', 'solid', ['#AA151B', '#F1BF00', '#F1BF00'], null, true],
  ['portugal', 'Portugal', INT, 'Portugal', 'solid', ['#8B1A2B', '#046A38', '#DA291C'], null, true],
  ['netherlands', 'Netherlands', INT, 'Netherlands', 'solid', ['#F36C21', '#111111', '#FFFFFF'], null, true],
  ['italy', 'Italy', INT, 'Italy', 'solid', ['#0064AA', '#FFFFFF', '#FFFFFF'], null, true],
];

export const PRICE = {
  [PL]: 55000, [LL]: 55000, [SA]: 52000, [BL]: 52000, [L1]: 50000,
  [ED]: 45000, [LP]: 45000, [SPL]: 48000, [MLS]: 48000, [BR]: 45000,
  [NP]: 25000, [INT]: 58000,
};

export const FEATURED = new Set(['arsenal', 'real-madrid', 'nigeria', 'barcelona', 'enyimba', 'ac-milan', 'man-city', 'psg']);
