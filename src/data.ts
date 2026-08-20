export interface Executive {
  id: string;
  name: string;
  nickname?: string;
  office: string;
  department: string;
  summary: string;
  imageUrl: string;
}

export interface SSRCMember {
  id: string;
  name: string;
  duty: string;
  department: string;
  imageUrl: string;
}

// Dummy data for Executives
export const executivesData: Executive[] = [
  {
    id: "1",
    name: "Comrade Ajayi Samuel",
    office: "President",
    department: "Computer Science",
    summary: "Leading the 36th administration towards digitalized excellence.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
  },
  {
    id: "2",
    name: "Comr Oluwadotun Samuel Damilare",
    nickname: "DAMI PR",
    office: "Vice President",
    department: "Microbiology",
    summary: "Ensuring maximum student welfare and administrative efficiency.",
    imageUrl: "/executives/vp.jpg"
  },
  {
    id: "3",
    name: "Comr Onovwiome Honourable Onome",
    nickname: "HONOURABLE",
    office: "General Secretary",
    department: "Mathematics",
    summary: `**HONOURABLE ONOVWIOME**

A visionary student leader, administrator, and technology enthusiast committed to transforming student governance through innovation, excellence, and service.

Currently serving as the **General Secretary of the Faculty of Science, Lagos State University (LASU)**, Honourable has distinguished himself through exceptional administrative leadership, strategic communication, and a passion for institutional development. His leadership is driven by the belief that every secretariat should be efficient, transparent, accessible, and powered by technology.

As the **Architect of the Digitalized and Innovative Secretariat**, he has championed initiatives that modernize administrative processes through digital documentation, structured record keeping, improved communication systems, and technology-driven solutions that enhance productivity, transparency, and accountability.

One of his landmark achievements is the creation of the **first-ever official NASS LASU website in over 35 years**, a groundbreaking milestone that reflects his unwavering commitment to innovation and digital transformation within the Faculty of Science. This achievement establishes his vision of leveraging technology to build a more connected, informed, and digitally empowered science student community.

Beyond student leadership, Honourable is an AI educator, digital solutions advocate, and mentor who has empowered hundreds of students with practical digital skills. His passion for innovation continues to bridge the gap between traditional administration and modern technology, creating sustainable systems that deliver lasting value.

With a vision centered on excellence, transparency, and innovation, Honourable remains committed to redefining student administration and building a Faculty of Science where technology serves every student, information is readily accessible, and leadership is driven by impact.

**"Architecting Innovation. Digitalizing Leadership. Building the Future of the Science Student Community."**`,
    imageUrl: "/executives/gen_sec.jpg"
  },
  {
    id: "4",
    name: "Comr Awe Obaoluwafolajimi Oluwasinaayomi",
    nickname: "OBA",
    office: "Welfare Director",
    department: "SLT",
    summary: "As the Welfare Director, Faculty of Science, I am committed to promoting the well-being, academic success, and overall welfare of every science student. My mission is to create a supportive and inclusive environment where students can thrive, access necessary assistance, and enjoy a balanced campus experience. Through impactful welfare initiatives, student-centered programs, and effective representation, I remain dedicated to serving with compassion, integrity, and excellence, ensuring that the interests and needs of all students remain a top priority.\n\nLet the Welfarism of the People be a measure of our progress...\n\nComrade Awe Obaoluwafolajimi O.\n36th NASS-LASU Welfare Director.",
    imageUrl: "/executives/welfare.jpg"
  },
  {
    id: "5",
    name: "Comr Akachukwu Ezekiel",
    nickname: "AKA",
    office: "Public Relations Officer",
    department: "Botany",
    summary: "A gospel recording artist,\nBrand Designer, Media executive\nWriter, Director, movie producer.\nCEO (FIRST CLASS PR)",
    imageUrl: "/executives/pro.jpg"
  },
  {
    id: "6",
    name: "Comr Oluwasanmi Micheal Olaoluwasubomi",
    nickname: "BIG MIKE",
    office: "Social Director",
    department: "Microbiology",
    summary: "Organizing engaging events and extracurricular activities.",
    imageUrl: "/executives/social_director.jpg"
  },
  {
    id: "7",
    name: "Comr Abraham Comfort",
    nickname: "COMFORT",
    office: "Financial Secretary",
    department: "Zoology",
    summary: "Managing the financial records and dues of the association.",
    imageUrl: "/executives/fin_sec.jpg"
  },
  {
    id: "9",
    name: "Comr Ogunsanya Ebuka Boluwatife",
    nickname: "WOLEX",
    office: "Sport Director",
    department: "SLT",
    summary: "The Office of the Sports Director serves as the driving force behind sports development and recreational activities within the Faculty of Science. It is committed to promoting physical fitness, teamwork, discipline, and unity by creating opportunities for students to participate in various sporting events and competitions.\n\nAs the Sports Director, my vision is to build a vibrant sporting culture where every student, regardless of skill level, has the opportunity to discover and develop their talents. Through effective planning, collaboration, and leadership, the office aims to organize competitive tournaments, encourage active participation in faculty and university sports, and foster an environment of inclusiveness and sportsmanship.\n\nBeyond competition, the office is dedicated to using sports as a tool for personal growth, healthy living, and stronger relationships among students. Together, we will strive to make the Faculty of Science a leading force in sports excellence, representing our faculty with pride, passion, and integrity.\n\n“United Through Sports, Driven by Excellence.”",
    imageUrl: "/executives/sport_director.jpg"
  },
  {
    id: "10",
    name: "Comr Adelegan Inioluwa",
    nickname: "PAIR",
    office: "Assistant General Secretary",
    department: "Microbiology",
    summary: "Adelegan Inioluwa is the Assistant General Secretary of the Natural Sciences Students' Association (NASS), Faculty of Science. A driven and forward-thinking student leader, he brings a commitment to innovation and administrative excellence to his secretariat.\n\nWith a vision centred on building a modern, accessible, and well-documented association, Adelegan is focused on transforming the NASS secretariat into a more efficient and technology-driven unit — one that serves the student body with greater transparency and responsiveness.\n\nAs part of his innovative agenda, he is championing initiatives such as the development of a dedicated faculty website, aimed at improving information flow, showcasing student achievements, and strengthening the association's digital presence.\n\nHe remains dedicated to serving the Faculty of Science community with integrity, creativity, and purpose.",
    imageUrl: "/executives/asst_gen_sec.jpg"
  }
];

// Dummy data for SSRC
export interface StudentBrand {
  id: string;
  name: string;
  owner: string;
  category: string;
  description: string;
  contact?: string;
  whatsappNumber?: string;
  price?: string;
  website?: string;
  productImageUrl?: string;
  imageUrl: string;
}

export const studentBrandsData: StudentBrand[] = [
  {
    id: "b1",
    name: "TechFix Solutions",
    owner: "Alex Johnson",
    category: "Gadget Repair & Sales",
    description: "Your go-to spot for fast and reliable smartphone and laptop repairs. We also sell quality accessories.",
    contact: "+234 800 123 4567",
    imageUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80"
  },
  {
    id: "b2",
    name: "Glamour By Sarah",
    owner: "Sarah Oladipo",
    category: "Beauty & Makeup",
    description: "Professional makeup services for all occasions. Enhancing your natural beauty.",
    contact: "+234 901 234 5678",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80"
  },
  {
    id: "b3",
    name: "Campus Bites",
    owner: "David Nwachukwu",
    category: "Food & Catering",
    description: "Delicious homemade meals delivered straight to your hostel. Taste the comfort of home.",
    contact: "+234 705 678 9012",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80"
  }
];

export const ssrcData: SSRCMember[] = [
  {
    id: "sr1",
    name: "Rt Hon. Essien Faith Taiwo",
    duty: "Speaker",
    department: "SLT",
    imageUrl: "/executives/faith.jpg"
  },
  {
    id: "sr2",
    name: "Fatima Yusuf",
    duty: "Deputy Speaker",
    department: "Botany",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80"
  },
  {
    id: "sr3",
    name: "Hon. Solomon Tumishe Blessing",
    duty: "CLERK",
    department: "MICROBIOLOGY",
    imageUrl: "/executives/tumi.jpg"
  }
];
