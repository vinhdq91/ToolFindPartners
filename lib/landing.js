// Landing pages: themes, block types and the starting content of a new page.

export const COLORS = [
  { value: '#c2410c', label: 'Terracotta' },
  { value: '#b91c1c', label: 'Lantern red' },
  { value: '#ca8a04', label: 'Hoi An yellow' },
  { value: '#0f766e', label: 'River teal' },
  { value: '#4338ca', label: 'Indigo' },
  { value: '#374151', label: 'Charcoal' },
];

export const FONTS = [
  { value: 'modern', label: 'Modern (clean)' },
  { value: 'classic', label: 'Classic (elegant serif)' },
  { value: 'friendly', label: 'Friendly (rounded)' },
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

export const PAGE_STATUSES = [
  { value: 'draft', label: 'Draft (only you can see it)' },
  { value: 'published', label: 'Published (anyone with the link)' },
];

export const BLOCK_LABELS = {
  hero: 'Hero (big photo and headline)',
  about: 'About us',
  steps: 'How it works',
  gallery: 'Gallery',
  partners: 'For partners',
  prices: 'Prices',
  reviews: 'What customers say',
  contact: 'Contact',
};

// What can be edited in each section. Types: text, textarea, image, images, list.
export const BLOCK_FIELDS = {
  hero: [
    { key: 'image', type: 'image', label: 'Background photo (wide photo works best)' },
    { key: 'headline', type: 'text', label: 'Headline' },
    { key: 'text', type: 'textarea', label: 'Short intro' },
    { key: 'button', type: 'text', label: 'Button text (jumps to Contact)' },
  ],
  about: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'text', type: 'textarea', label: 'Your story', rows: 6 },
    { key: 'image', type: 'image', label: 'Photo (optional)' },
  ],
  steps: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'items', type: 'list', label: 'Steps', itemLabel: 'Step', fields: [
      { key: 'title', type: 'text', label: 'Title' },
      { key: 'text', type: 'textarea', label: 'Text', rows: 2 },
    ] },
  ],
  gallery: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'images', type: 'images', label: 'Photos' },
  ],
  partners: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'items', type: 'list', label: 'Benefits', itemLabel: 'Benefit', fields: [
      { key: 'title', type: 'text', label: 'Title' },
      { key: 'text', type: 'textarea', label: 'Text', rows: 2 },
    ] },
  ],
  prices: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'items', type: 'list', label: 'Prices', itemLabel: 'Item', fields: [
      { key: 'name', type: 'text', label: 'Product' },
      { key: 'price', type: 'text', label: 'Price' },
      { key: 'note', type: 'text', label: 'Note' },
    ] },
  ],
  reviews: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'items', type: 'list', label: 'Reviews', itemLabel: 'Review', fields: [
      { key: 'quote', type: 'textarea', label: 'Review', rows: 3 },
      { key: 'author', type: 'text', label: 'Name, country' },
    ] },
  ],
  contact: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'text', type: 'textarea', label: 'Text', rows: 2 },
    { key: 'phone', type: 'text', label: 'Phone' },
    { key: 'zalo', type: 'text', label: 'Zalo number' },
    { key: 'whatsapp', type: 'text', label: 'WhatsApp number' },
    { key: 'email', type: 'text', label: 'Email' },
    { key: 'facebook', type: 'text', label: 'Facebook page link' },
    { key: 'address', type: 'text', label: 'Address' },
    { key: 'map_url', type: 'text', label: 'Google Maps link' },
  ],
};

// Turns a title into a link name: "Hội An Day Trip" -> "hoi-an-day-trip"
export function slugify(text) {
  return (
    String(text ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'page'
  );
}

let counter = 0;
export function blockId() {
  counter = (counter + 1) % 1000;
  return Date.now().toString(36) + counter.toString(36) + Math.random().toString(36).slice(2, 6);
}

// Starting content. Text in [brackets] is for you to replace in the editor.
const CONTENT = {
  en: {
    hero: {
      headline: 'Turn your Hoi An memories into magnets',
      text: 'We print your own travel photos as custom fridge magnets, made by hand in Hoi An.',
      button: 'Contact us',
    },
    about: {
      heading: 'About us',
      text: '[Tell your story: who you are, when the workshop started, and what makes your magnets special.]',
    },
    steps: {
      heading: 'How it works',
      items: [
        { title: 'Send a photo', text: 'Guests choose their favourite photo from their trip.' },
        { title: 'We design it', text: 'We fit the photo to a Hoi An magnet design.' },
        { title: 'Take it home', text: '[How long it takes, e.g. ready in 30 minutes.]' },
      ],
    },
    gallery: { heading: 'Our magnets', images: [] },
    partners: {
      heading: 'Work with us',
      items: [
        { title: 'Gifts for your guests', text: 'Give each guest a personal magnet from their stay or tour.' },
        { title: 'Refer guests, share profit', text: 'Introduce your guests to us and we share the profit from their orders.' },
        { title: 'Something new for your programs', text: 'Add a creative, personal activity to your tours and hotel services.' },
      ],
    },
    prices: {
      heading: 'Prices',
      items: [{ name: '[Product name]', price: '[Price]', note: '[Short note]' }],
    },
    reviews: {
      heading: 'What customers say',
      items: [{ quote: '[A real review from a customer]', author: '[Name, country]' }],
    },
    contact: {
      heading: 'Contact us',
      text: 'We would love to hear from you.',
      phone: '',
      zalo: '',
      whatsapp: '',
      email: '',
      facebook: '',
      address: '[Address], Hoi An',
      map_url: '',
    },
  },
  vi: {
    hero: {
      headline: 'Lưu giữ kỷ niệm Hội An trên từng chiếc nam châm',
      text: 'Chúng tôi in ảnh du lịch của chính bạn thành nam châm tủ lạnh, làm thủ công tại Hội An.',
      button: 'Liên hệ',
    },
    about: {
      heading: 'Về chúng tôi',
      text: '[Kể câu chuyện của xưởng: bạn là ai, bắt đầu từ khi nào, điều gì làm nam châm của bạn đặc biệt.]',
    },
    steps: {
      heading: 'Cách thực hiện',
      items: [
        { title: 'Gửi ảnh', text: 'Khách chọn tấm ảnh yêu thích trong chuyến đi.' },
        { title: 'Thiết kế', text: 'Chúng tôi đưa ảnh vào mẫu nam châm mang nét Hội An.' },
        { title: 'Mang về nhà', text: '[Thời gian làm, ví dụ: xong trong 30 phút.]' },
      ],
    },
    gallery: { heading: 'Sản phẩm của chúng tôi', images: [] },
    partners: {
      heading: 'Hợp tác cùng chúng tôi',
      items: [
        { title: 'Quà tặng cho khách', text: 'Tặng mỗi vị khách một chiếc nam châm in ảnh chuyến đi của họ.' },
        { title: 'Giới thiệu khách, chia lợi nhuận', text: 'Giới thiệu khách cho chúng tôi và cùng chia lợi nhuận từ đơn hàng.' },
        { title: 'Thêm trải nghiệm mới', text: 'Thêm một hoạt động sáng tạo, cá nhân hoá cho tour và dịch vụ khách sạn.' },
      ],
    },
    prices: {
      heading: 'Bảng giá',
      items: [{ name: '[Tên sản phẩm]', price: '[Giá]', note: '[Ghi chú ngắn]' }],
    },
    reviews: {
      heading: 'Khách hàng nói gì',
      items: [{ quote: '[Một đánh giá thật từ khách hàng]', author: '[Tên, quốc gia]' }],
    },
    contact: {
      heading: 'Liên hệ',
      text: 'Rất mong được hợp tác cùng bạn.',
      phone: '',
      zalo: '',
      whatsapp: '',
      email: '',
      facebook: '',
      address: '[Địa chỉ], Hội An',
      map_url: '',
    },
  },
};

const BLOCK_ORDER = ['hero', 'about', 'steps', 'gallery', 'partners', 'prices', 'reviews', 'contact'];

export function defaultBlocks(language = 'en') {
  const content = CONTENT[language] ?? CONTENT.en;
  return BLOCK_ORDER.map((type) => ({
    id: blockId(),
    type,
    visible: true,
    data: structuredClone({ ...content[type], ...(type === 'hero' || type === 'about' ? { image: '' } : {}) }),
  }));
}