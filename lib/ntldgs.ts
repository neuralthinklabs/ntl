// Single source of truth for the 12 NTLDGs (Neural Think Labs Development
// Goals). Ported from the original HTML prototype, where this lived as an
// untyped array-of-arrays (G[3] = colour, G[7] = areas, ...). Typed fields
// make the page, metadata and any future API/CMS use the same shape.

export type Goal = {
  /** URL-safe id, used for ?goal=<slug> deep links. */
  slug: string
  /** 1-based, shown in the UI. */
  number: number
  /** One-word verb: "Live", "Access", ... */
  verb: string
  title: string
  tagline: string
  question: string
  /** Short formula for the symbol, e.g. "Door + path + openness". */
  symbolConcept: string
  symbolDescription: string
  areas: readonly string[]
  /** Index into `missions`. */
  mission: 0 | 1 | 2
  /**
   * Decorative accent only (borders, dots, rings). Several accents are
   * near-identical (e.g. Live/Build) and several fail text contrast on
   * white, so NEVER use this as text colour or as the only identifier.
   */
  accent: string
}

export type Mission = {
  numeral: string
  title: string
  verbs: string
  summary: string
}

export const missions: readonly Mission[] = [
  {
    numeral: 'I',
    title: 'Help every person thrive',
    verbs: 'Live. Access. Learn. Choose. Belong. Contribute.',
    summary: "Mission I covers the goals about each person's own life.",
  },
  {
    numeral: 'II',
    title: 'Help humanity navigate change',
    verbs: 'Understand. Innovate. Build.',
    summary: 'Mission II covers the goals about how we handle change.',
  },
  {
    numeral: 'III',
    title: 'Protect the future',
    verbs: 'Restore. Cooperate. Future.',
    summary: 'Mission III covers the goals about our shared world.',
  },
]

export const goals: readonly Goal[] = [
  {
    slug: 'live',
    number: 1,
    verb: 'Live',
    title: 'A Good Life',
    tagline: 'Everyone deserves a life worth living.',
    question: 'Can every person live a healthy, safe and fulfilling life?',
    symbolConcept: 'Life + wholeness + wellbeing',
    symbolDescription:
      'A symbolic form representing a complete, protected and flourishing human life.',
    areas: [
      'Poverty and deprivation',
      'Food and nutrition',
      'Health and healthcare',
      'Mental wellbeing',
      'Housing',
      'Water and sanitation',
      'Safety',
      'Basic financial security',
      'Dignity',
      'Quality of life',
    ],
    mission: 0,
    accent: '#f6a313',
  },
  {
    slug: 'access',
    number: 2,
    verb: 'Access',
    title: 'Access for Everyone',
    tagline: 'No one left out. No one left behind.',
    question: 'Can everyone reach the services and opportunities they need?',
    symbolConcept: 'Door + path + openness',
    symbolDescription:
      'An open gateway showing a person stepping through to opportunity.',
    areas: [
      'Digital access',
      'Transport and mobility',
      'Disability inclusion',
      'Rural connection',
      'Affordable services',
      'Legal identity',
      'Public information',
    ],
    mission: 0,
    accent: '#1f7ae0',
  },
  {
    slug: 'learn',
    number: 3,
    verb: 'Learn',
    title: 'Learning & Human Potential',
    tagline: 'Become more capable.',
    question: 'Can every person learn and develop their full potential?',
    symbolConcept: 'Leaves + growth + person',
    symbolDescription: 'Leaves rising from a figure, showing learning as growth.',
    areas: [
      'Early childhood',
      'Quality schooling',
      'Skills for work',
      'Lifelong learning',
      'Literacy',
      'Creativity',
      'Teachers and mentors',
    ],
    mission: 0,
    accent: '#2fa55a',
  },
  {
    slug: 'choose',
    number: 4,
    verb: 'Choose',
    title: 'Freedom & Equal Opportunity',
    tagline: 'Your starting point should not define your future.',
    question: 'Can each person make real choices about their own life?',
    symbolConcept: 'Person + open arms + options',
    symbolDescription:
      'A figure with open arms, standing between many possible paths.',
    areas: [
      'Equality of opportunity',
      'Gender equality',
      'Freedom of expression',
      'Fair treatment',
      'Economic mobility',
      'Personal agency',
    ],
    mission: 0,
    accent: '#8a3fd1',
  },
  {
    slug: 'belong',
    number: 5,
    verb: 'Belong',
    title: 'Family, Community & Social Wellbeing',
    tagline: 'A better world is built by people who care for one another.',
    question: 'Does every person have people and places where they belong?',
    symbolConcept: 'Circle + connection + care',
    symbolDescription:
      'Linked rings around a centre, showing a person held by community.',
    areas: [
      'Family support',
      'Community spaces',
      'Loneliness and isolation',
      'Social trust',
      'Civic life',
      'Cultural identity',
      'Care for elders and children',
    ],
    mission: 0,
    accent: '#ee4a5a',
  },
  {
    slug: 'contribute',
    number: 6,
    verb: 'Contribute',
    title: 'Meaningful Work & Shared Prosperity',
    tagline: 'Everyone deserves a chance to contribute and prosper.',
    question: 'Can everyone do meaningful work and share in the gains?',
    symbolConcept: 'Spark + work + sharing',
    symbolDescription:
      'A four-point star showing many contributions making one result.',
    areas: [
      'Decent jobs',
      'Fair pay',
      'Entrepreneurship',
      'Worker voice',
      'Unpaid care work',
      'Local economies',
      'Shared wealth',
    ],
    mission: 0,
    accent: '#14a3a0',
  },
  {
    slug: 'understand',
    number: 7,
    verb: 'Understand',
    title: 'Knowledge, Truth & Trust',
    tagline: 'Better knowledge. Better decisions. Better society.',
    question: 'Can people trust the information they use to make decisions?',
    symbolConcept: 'Eye + signal + clarity',
    symbolDescription:
      'Concentric rings around a bright centre, showing clear sight.',
    areas: [
      'Reliable information',
      'Media literacy',
      'Open data',
      'Science and research',
      'Trust in institutions',
      'Misinformation',
      'Privacy',
    ],
    mission: 1,
    accent: '#5a3fd1',
  },
  {
    slug: 'innovate',
    number: 8,
    verb: 'Innovate',
    title: 'Technology & Innovation for Humanity',
    tagline: 'Make technology work for humanity.',
    question: 'Does technology make life better for everyone?',
    symbolConcept: 'Spark + tool + humanity',
    symbolDescription: 'A flowing shape joining a person and a bright idea.',
    areas: [
      'Responsible AI',
      'Open science',
      'Affordable technology',
      'Digital rights',
      'Medical innovation',
      'Inclusive design',
      'Public-interest tech',
    ],
    mission: 1,
    accent: '#1d8de0',
  },
  {
    slug: 'build',
    number: 9,
    verb: 'Build',
    title: 'Clean Energy & Strong Systems',
    tagline: 'Power a better life. Build for tomorrow.',
    question: 'Do the systems we depend on work for everyone, cleanly?',
    symbolConcept: 'Arches + energy + foundation',
    symbolDescription:
      'Layered arches rising like power, shelter and strength.',
    areas: [
      'Clean energy',
      'Resilient infrastructure',
      'Sustainable cities',
      'Waste and recycling',
      'Public transit',
      'Safe buildings',
      'Reliable utilities',
    ],
    mission: 1,
    accent: '#f2a50c',
  },
  {
    slug: 'restore',
    number: 10,
    verb: 'Restore',
    title: 'A Healthy & Regenerative Planet',
    tagline: "Don't just protect Earth. Restore it.",
    question: 'Can we leave the planet healthier than we found it?',
    symbolConcept: 'Leaf + person + renewal',
    symbolDescription:
      'Two leaves cradling a figure, showing people within nature.',
    areas: [
      'Climate action',
      'Biodiversity',
      'Oceans and rivers',
      'Forests and soil',
      'Clean air',
      'Circular economy',
      'Regenerative farming',
    ],
    mission: 2,
    accent: '#1f9a5b',
  },
  {
    slug: 'cooperate',
    number: 11,
    verb: 'Cooperate',
    title: 'Peace, Justice & Good Governance',
    tagline: 'Peace creates the space for progress.',
    question: 'Can people live together in peace, with fair institutions?',
    symbolConcept: 'Rings + balance + unity',
    symbolDescription:
      'Nested rings around a pillar, representing justice held together.',
    areas: [
      'Peace and security',
      'Rule of law',
      'Accountable institutions',
      'Access to justice',
      'Corruption',
      'Global cooperation',
      'Participation in decisions',
    ],
    mission: 2,
    accent: '#3a3fc4',
  },
  {
    slug: 'future',
    number: 12,
    verb: 'Future',
    title: 'A Future Worth Inheriting',
    tagline: 'Build a future we would be proud to inherit.',
    question: 'Will the next generation inherit a better world?',
    symbolConcept: 'Horizon + wave + hope',
    symbolDescription: 'Rising waves over a horizon, looking ahead.',
    areas: [
      'Long-term thinking',
      'Youth voice',
      'Future generations',
      'Risk and resilience',
      'Foresight',
      'Intergenerational fairness',
    ],
    mission: 2,
    accent: '#1aa8a8',
  },
]

export function goalIndexBySlug(slug: string | undefined | null) {
  if (!slug) return -1
  return goals.findIndex((g) => g.slug === slug)
}

// The development chain, loop and principles from the "system" section.
export const developmentChain = [
  'Goal',
  'Purpose',
  'Areas',
  'Targets',
  'Indicators',
  'Problems',
  'Missions',
  'Actions',
  'Solutions',
  'Impact',
] as const

export const ntlLoop = [
  'Discover',
  'Learn',
  'Understand',
  'Care',
  'Act',
  'Contribute',
  'Create',
  'Share',
  'Inspire',
] as const

export const principles = [
  'Human-centred',
  'Inclusive',
  'Evidence-based',
  'Sustainable and regenerative',
  'Future-minded',
  'Collaborative',
  'Action-oriented',
] as const
