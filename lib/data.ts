export type PortfolioType =
  | 'Product'
  | 'Service'
  | 'Venture'
  | 'System'
  | 'Publication'

export type Status = 'Active' | 'In Progress' | 'Planned' | 'Completed'

export const portfolio: {
  name: string
  type: PortfolioType
  status: Status
  description: string
}[] = [
  {
    name: 'NeuroLearn',
    type: 'Product',
    status: 'Active',
    description: 'AI-powered learning platform for lifelong learners.',
  },
  {
    name: 'Community Research Hub',
    type: 'Service',
    status: 'Active',
    description: 'Connects researchers with real-world problems and data.',
  },
  {
    name: 'Clean Water Initiative',
    type: 'Venture',
    status: 'In Progress',
    description: 'Sustainable water solutions for rural communities.',
  },
  {
    name: 'Open Knowledge Library',
    type: 'Publication',
    status: 'Active',
    description: 'Free access to research, guides and educational resources.',
  },
  {
    name: 'Impact Analytics System',
    type: 'System',
    status: 'Planned',
    description: 'Track and measure real-world impact across projects.',
  },
  {
    name: 'Mentor Network',
    type: 'Service',
    status: 'Active',
    description: 'Pairs experts with grassroots teams solving local problems.',
  },
]

export const events = [
  {
    month: 'APR',
    day: '24',
    title: 'Global Innovation Summit 2025',
    meta: 'Online · 9:00 AM – 5:00 PM',
    description:
      'Speakers, workshops and networking with changemakers from around the world.',
  },
  {
    month: 'MAY',
    day: '10',
    title: 'AI for Social Good Workshop',
    meta: 'Online · 2:00 PM – 4:00 PM',
    description:
      'Hands-on session exploring how AI can solve real-world challenges.',
  },
  {
    month: 'MAY',
    day: '17',
    title: 'Community Problem Solving Meetup',
    meta: 'New York, NY · 6:00 PM',
    description:
      'Share ideas, connect and help shape upcoming projects.',
  },
]

export const pastEvents = [
  {
    month: 'MAR',
    day: '12',
    title: 'Research & Impact Forum 2025',
    meta: 'Online · 9:00 AM – 1:00 PM',
    description: 'Updates, talks and project showcases.',
  },
]

export const stories = [
  {
    title: 'How Community Input Turned Into a Real Project',
    date: 'Apr 12, 2025',
    category: 'Project Stories',
    excerpt:
      'From a local problem submission to a funded initiative — here is how it happened.',
    image: '/images/story-community.png',
  },
  {
    title: 'The Power of Cross-Disciplinary Teams',
    date: 'Apr 6, 2025',
    category: 'Research',
    excerpt:
      'How researchers, developers, designers and educators built a better solution together.',
    image: '/images/story-team.png',
  },
  {
    title: 'New Research: AI for Rural Healthcare',
    date: 'Mar 26, 2025',
    category: 'Research',
    excerpt:
      'Our latest study shows promising results for AI-powered diagnostics in low-resource settings.',
    image: '/images/story-health.png',
  },
  {
    title: 'Education Access in Action',
    date: 'Mar 20, 2025',
    category: 'Education',
    excerpt:
      'How we are working with partners to expand learning opportunities worldwide.',
    image: '/images/story-education.png',
  },
  {
    title: 'Behind the Scenes: Building Our Platform',
    date: 'Mar 12, 2025',
    category: 'News',
    excerpt:
      'A look at the tools and people making Neural Think Labs public website possible.',
    image: '/images/story-platform.png',
  },
]

export const storyCategories = [
  'All',
  'Project Stories',
  'Research',
  'News',
  'Education',
]

export const goals = [
  {
    name: 'Clean Water for Rural Communities',
    raised: 31000,
    target: 50000,
    percent: 62,
  },
  {
    name: 'Education for Everyone',
    raised: 16300,
    target: 40000,
    percent: 41,
  },
  {
    name: 'Open Knowledge Library',
    raised: 7500,
    target: 25000,
    percent: 30,
  },
]

export const stats = [
  { value: '6', label: 'Active Projects' },
  { value: '12', label: 'Community Events' },
  { value: '1.2K', label: 'People Engaged' },
  { value: '8', label: 'Partner Institutions' },
]
