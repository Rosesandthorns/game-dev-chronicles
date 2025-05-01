
import { Post } from '../lib/types';

export const posts: Post[] = [
  {
    id: '1',
    title: 'New Combat System Preview',
    excerpt: 'Our redesigned combat system brings more dynamic action and strategic depth.',
    content: `
      # New Combat System Preview
      
      We've been hard at work redesigning the combat system from the ground up. The new system focuses on providing more dynamic action while maintaining strategic depth.
      
      ## Key Improvements
      
      - **Responsive Controls**: Completely overhauled the input system for more precise character movement
      - **Combo System**: Chain attacks together for devastating special moves
      - **Environmental Interactions**: Use the terrain to your advantage during combat
      
      Our goal is to create a system that's easy to pick up but challenging to master. We're excited to see players discover all the nuances and strategies once this update goes live next month.
      
      Stay tuned for more combat previews in the coming weeks!
    `,
    author: {
      name: 'Alex Chen',
      role: 'Lead Combat Designer',
      avatar: 'https://i.pravatar.cc/150?u=alex'
    },
    date: '2024-04-28',
    category: 'gameplay',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    featured: true
  },
  {
    id: '2',
    title: 'Art Direction Update: New Environment Concepts',
    excerpt: 'Explore the artistic vision behind our upcoming forest level.',
    content: `
      # Art Direction Update: New Environment Concepts
      
      The art team has been focused on developing concepts for the Enchanted Forest level, and we're thrilled to share some of our progress.
      
      This environment presented unique challenges in balancing magical elements with realistic forest details. We wanted to create a space that feels both familiar and otherworldly.
      
      ## Design Principles
      
      - Using complementary colors to create visual interest
      - Implementing dynamic lighting that changes based on player progression
      - Designing landmarks that serve both narrative and navigational purposes
      
      We're particularly proud of the central ancient tree that will serve as both a visual anchor and a key story element. Its bioluminescent features will guide players and create memorable moments throughout the level.
      
      More concept art will be shared in our next update!
    `,
    author: {
      name: 'Sofia Patel',
      role: 'Art Director',
      avatar: 'https://i.pravatar.cc/150?u=sofia'
    },
    date: '2024-04-25',
    category: 'art',
    image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    featured: false
  },
  {
    id: '3',
    title: 'Performance Optimization Progress',
    excerpt: 'Technical update on our recent rendering and loading time improvements.',
    content: `
      # Performance Optimization Progress
      
      This past sprint, our technical team focused on performance optimizations across both PC and console builds. We're happy to report significant improvements in several areas.
      
      ## Improvements
      
      - **Loading Times**: Reduced initial load time by 37% through asset streaming refinements
      - **Frame Rate**: Achieved more consistent frame rates in complex environments
      - **Memory Usage**: Decreased memory footprint by 15% through texture compression improvements
      
      These changes will be especially noticeable on mid-range hardware, where we've seen up to 45% better performance in our benchmark tests.
      
      We're continuing to profile and optimize, with a focus next sprint on particle systems and complex shader optimizations.
    `,
    author: {
      name: 'Marcus Johnson',
      role: 'Technical Director',
      avatar: 'https://i.pravatar.cc/150?u=marcus'
    },
    date: '2024-04-22',
    category: 'technical',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    featured: false
  },
  {
    id: '4',
    title: 'Closed Beta Test Announcement',
    excerpt: 'Join our upcoming closed beta and help shape the future of our game!',
    content: `
      # Closed Beta Test Announcement
      
      We're excited to announce our upcoming closed beta test scheduled for June 15-30, 2024!
      
      This test will focus on core gameplay loops, multiplayer stability, and overall balance. As a beta participant, your feedback will directly influence our development priorities.
      
      ## What to Expect
      
      - Access to the first 3 story chapters
      - 5 playable character classes
      - 2 multiplayer modes
      - Weekly developer surveys and feedback sessions
      
      ## How to Join
      
      Beta signups will open on May 10th through our website. We'll select participants based on hardware specifications and previous beta participation.
      
      This is a crucial step in our development journey, and we can't wait to get your insights on what we've built!
    `,
    author: {
      name: 'Eliza Kim',
      role: 'Community Manager',
      avatar: 'https://i.pravatar.cc/150?u=eliza'
    },
    date: '2024-04-18',
    category: 'announcement',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    featured: true
  },
  {
    id: '5',
    title: 'Sound Design Deep Dive: Creating Immersive Audio',
    excerpt: 'Explore how our audio team crafts the sounds that bring our world to life.',
    content: `
      # Sound Design Deep Dive: Creating Immersive Audio
      
      Audio is one of the most important yet often overlooked aspects of game development. Today, we want to give you insight into how our audio team approaches creating an immersive soundscape.
      
      ## Our Audio Philosophy
      
      We believe that sound should not just complement visuals but enhance and extend them. Our approach combines field recordings, synthesized elements, and dynamic audio systems to create a responsive audio experience.
      
      ## Recent Developments
      
      - **Adaptive Music System**: Music that seamlessly transitions based on gameplay intensity
      - **Environmental Audio**: Location-specific sound profiles that reflect materials and spaces
      - **Character-specific Foley**: Each character has unique movement sounds based on their equipment
      
      We've recently completed a field recording trip to capture authentic forest sounds for our upcoming levels. These raw recordings are processed and layered to create the rich audio tapestry you'll hear in-game.
      
      Listen for these details in our next gameplay video!
    `,
    author: {
      name: 'David Rivera',
      role: 'Audio Director',
      avatar: 'https://i.pravatar.cc/150?u=david'
    },
    date: '2024-04-15',
    category: 'art',
    image: 'https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    featured: false
  },
];

export const getFeaturedPosts = () => posts.filter(post => post.featured);
export const getRecentPosts = () => [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
