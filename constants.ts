import { MenuItem, ProductCategory, Table, TableStatus, ItemType } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'c1',
    name: 'Combo Lẩu Uyên Ương (2 người)',
    price: 299000,
    category: ProductCategory.COMBO,
    image: 'https://picsum.photos/200/200?random=10',
    description: 'Tiết kiệm 20%. Bao gồm nước lẩu, thịt và rau.',
    available: true,
    type: ItemType.COMBO,
    isRecommended: true,
    ingredients: ['Nước lẩu tùy chọn', 'Ba chỉ bò Mỹ', 'Bắp bò Úc', 'Rau muống', 'Cải thảo', 'Nấm kim châm', 'Mì tôm'],
    comboGroups: [
      {
        id: 'g1',
        title: 'Chọn vị nước lẩu',
        min: 1,
        max: 1,
        options: [
            { id: 'opt1', name: 'Lẩu Thái Tomyum (+29k)', price: 29000 },
            { id: 'opt2', name: 'Lẩu Nấm Thiên Nhiên' },
            { id: 'opt3', name: 'Lẩu Tứ Xuyên (+39k)', price: 39000 }
        ]
      },
      {
        id: 'g2',
        title: 'Chọn 2 loại thịt',
        min: 2,
        max: 2,
        options: [
            { id: 'opt_m1', name: 'Ba Chỉ Bò Mỹ' },
            { id: 'opt_m2', name: 'Bắp Bò Úc' },
            { id: 'opt_m3', name: 'Gầu Bò' },
            { id: 'opt_m4', name: 'Sườn Sụn Heo' }
        ]
      },
      {
        id: 'g3',
        title: 'Chọn rau/nấm (Tối đa 2)',
        min: 1,
        max: 2,
        options: [
            { id: 'opt_v1', name: 'Rau Muống' },
            { id: 'opt_v2', name: 'Cải Thảo' },
            { id: 'opt_v3', name: 'Nấm Kim Châm' },
            { id: 'opt_v4', name: 'Nấm Đùi Gà' }
        ]
      }
    ]
  },
  {
    id: 'm1',
    name: 'Nước Lẩu Thái Tomyum',
    price: 129000,
    category: ProductCategory.BROTH,
    image: 'https://picsum.photos/200/200?random=1',
    description: 'Chua cay đậm đà, hương vị Thái Lan.',
    available: true,
    type: ItemType.SINGLE,
    isRecommended: true,
    ingredients: ['Nước hầm xương', 'Sả', 'Riềng', 'Lá chanh', 'Ớt', 'Cốt dừa', 'Tôm khô']
  },
  {
    id: 'm2',
    name: 'Nước Lẩu Nấm Thiên Nhiên',
    price: 119000,
    category: ProductCategory.BROTH,
    image: 'https://picsum.photos/200/200?random=2',
    description: 'Ngọt thanh từ các loại nấm quý.',
    available: true,
    type: ItemType.SINGLE,
    ingredients: ['Nước hầm gà', 'Nấm hương', 'Nấm đùi gà', 'Kỷ tử', 'Táo đỏ']
  },
  {
    id: 'm3',
    name: 'Ba Chỉ Bò Mỹ',
    price: 89000,
    category: ProductCategory.MEAT,
    image: 'https://picsum.photos/200/200?random=3',
    description: 'Thịt mềm, mỡ nạc đan xen.',
    available: true,
    type: ItemType.SINGLE,
    isRecommended: true,
    ingredients: ['100% Ba chỉ bò Mỹ nhập khẩu']
  },
  {
    id: 'm4',
    name: 'Bắp Bò Úc',
    price: 99000,
    category: ProductCategory.MEAT,
    image: 'https://picsum.photos/200/200?random=4',
    description: 'Giòn sần sật, không ngấy.',
    available: true,
    type: ItemType.SINGLE,
    ingredients: ['100% Bắp bò Úc nhập khẩu']
  },
  {
    id: 'm5',
    name: 'Tôm Sú Tươi',
    price: 109000,
    category: ProductCategory.SEAFOOD,
    image: 'https://picsum.photos/200/200?random=5',
    description: 'Tôm tươi nhảy tanh tách.',
    available: true,
    type: ItemType.SINGLE,
    ingredients: ['Tôm sú sống (150g)']
  },
  {
    id: 'm6',
    name: 'Combo Rau Tổng Hợp',
    price: 59000,
    category: ProductCategory.VEGGIE,
    image: 'https://picsum.photos/200/200?random=6',
    description: 'Rau cải, nấm, ngô ngọt.',
    available: true,
    type: ItemType.SINGLE,
    ingredients: ['Cải thảo', 'Rau muống', 'Cải chíp', 'Ngô ngọt', 'Nấm kim châm']
  },
  {
    id: 'm7',
    name: 'Nấm Kim Châm',
    price: 29000,
    category: ProductCategory.VEGGIE,
    image: 'https://picsum.photos/200/200?random=7',
    description: 'Nấm trắng tươi ngon.',
    available: true,
    type: ItemType.SINGLE,
    ingredients: ['Nấm kim châm trắng (200g)']
  },
  {
    id: 'm8',
    name: 'Trà Chanh',
    price: 15000,
    category: ProductCategory.DRINK,
    image: 'https://picsum.photos/200/200?random=8',
    description: 'Giải nhiệt cực đã.',
    available: true,
    type: ItemType.SINGLE,
    isRecommended: true,
    ingredients: ['Trà nhài', 'Chanh tươi', 'Đường', 'Đá']
  },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Bàn ${i + 1}`,
  status: TableStatus.EMPTY,
}));

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.COMBO]: 'Combo Tiết Kiệm',
  [ProductCategory.BROTH]: 'Nước Lẩu',
  [ProductCategory.MEAT]: 'Thịt Bò/Heo',
  [ProductCategory.SEAFOOD]: 'Hải Sản',
  [ProductCategory.VEGGIE]: 'Rau & Nấm',
  [ProductCategory.DRINK]: 'Đồ Uống',
  [ProductCategory.OTHER]: 'Khác',
};