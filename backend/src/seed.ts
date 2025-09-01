import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from './typeorm.config';
import { Category } from './categories/category.entity';

async function run() {
  const ds = await (dataSource instanceof DataSource
    ? dataSource.initialize()
    : Promise.reject('Invalid data source'));

  const catRepo = ds.getRepository(Category);

  // Sistem kategorilerini oluştur
  const systemIncomeCategories = [
    { name: 'Maaş', priority: 1, color: '#22C55E' },           // En yüksek öncelik - Parlak yeşil
    { name: 'Ek Gelir', priority: 2, color: '#16A34A' },       // Yüksek öncelik - Koyu yeşil
    { name: 'Yatırım Geliri', priority: 3, color: '#15803D' }, // Yüksek öncelik - Orman yeşili
    { name: 'Kira Geliri', priority: 4, color: '#166534' },    // Orta öncelik - Koyu orman yeşili
    { name: 'Faiz Geliri', priority: 5, color: '#14532D' },   // Orta öncelik - Çok koyu yeşil
    { name: 'İkramiye', priority: 6, color: '#059669' },      // Orta öncelik - Teal yeşili
    { name: 'Komisyon', priority: 7, color: '#047857' },      // Düşük öncelik - Koyu teal
    { name: 'Hediye', priority: 8, color: '#065F46' },        // Düşük öncelik - Çok koyu teal
    { name: 'Diğer Gelir', priority: 9, color: '#064E3B' },   // En düşük öncelik - En koyu teal
  ];

  const systemExpenseCategories = [
    { name: 'Market', priority: 1, color: '#EF4444' },        // En yüksek öncelik - Parlak kırmızı
    { name: 'Faturalar', priority: 2, color: '#DC2626' },     // Yüksek öncelik - Koyu kırmızı
    { name: 'Sağlık', priority: 3, color: '#B91C1C' },        // Yüksek öncelik - Çok koyu kırmızı
    { name: 'Ulaşım', priority: 4, color: '#991B1B' },        // Orta öncelik - Koyu bordo
    { name: 'Eğitim', priority: 5, color: '#7F1D1D' },        // Orta öncelik - Çok koyu bordo
    { name: 'Giyim', priority: 6, color: '#DC2626' },         // Orta öncelik - Koyu kırmızı
    { name: 'Ev & Mobilya', priority: 7, color: '#B91C1C' }, // Düşük öncelik - Çok koyu kırmızı
    { name: 'Eğlence', priority: 8, color: '#991B1B' },       // Düşük öncelik - Koyu bordo
    { name: 'Teknoloji', priority: 9, color: '#7F1D1D' },    // Düşük öncelik - Çok koyu bordo
    { name: 'Spor & Hobi', priority: 10, color: '#450A0A' },  // En düşük öncelik - En koyu bordo
    { name: 'Seyahat', priority: 10, color: '#450A0A' },      // En düşük öncelik - En koyu bordo
    { name: 'Diğer Gider', priority: 10, color: '#DC2626' },  // En düşük öncelik - Koyu kırmızı
  ];

  // Sistem gelir kategorilerini oluştur
  for (const cat of systemIncomeCategories) {
    let existingCat = await catRepo.findOne({ 
      where: { isSystem: true, name: cat.name, kind: 'INCOME' } 
    });
    if (!existingCat) {
      existingCat = catRepo.create({
        name: cat.name,
        kind: 'INCOME',
        priority: cat.priority,
        color: cat.color,
        isSystem: true,
        isSystemOverride: false, // Sistem kategorisi olduğu için false
        originalSystemId: undefined, // Sistem kategorisi olduğu için undefined
      });
      await catRepo.save(existingCat);
      console.log(`Sistem kategorisi oluşturuldu: ${cat.name} (Gelir) - Öncelik: ${cat.priority} - Renk: ${cat.color}`);
    } else {
      // Mevcut kategoriyi güncelle (sadece öncelik ve renk)
      existingCat.priority = cat.priority;
      existingCat.color = cat.color;
      await catRepo.save(existingCat);
      console.log(`Sistem kategorisi güncellendi: ${cat.name} (Gelir) - Öncelik: ${cat.priority} - Renk: ${cat.color}`);
    }
  }

  // Sistem gider kategorilerini oluştur
  for (const cat of systemExpenseCategories) {
    let existingCat = await catRepo.findOne({ 
      where: { isSystem: true, name: cat.name, kind: 'EXPENSE' } 
    });
    if (!existingCat) {
      existingCat = catRepo.create({
        name: cat.name,
        kind: 'EXPENSE',
        priority: cat.priority,
        color: cat.color,
        isSystem: true,
        isSystemOverride: false, // Sistem kategorisi olduğu için false
        originalSystemId: undefined, // Sistem kategorisi olduğu için undefined
      });
      await catRepo.save(existingCat);
      console.log(`Sistem kategorisi oluşturuldu: ${cat.name} (Gider) - Öncelik: ${cat.priority} - Renk: ${cat.color}`);
    } else {
      // Mevcut kategoriyi güncelle (sadece öncelik ve renk)
      existingCat.priority = cat.priority;
      existingCat.color = cat.color;
      await catRepo.save(existingCat);
      console.log(`Sistem kategorisi güncellendi: ${cat.name} (Gider) - Öncelik: ${cat.priority} - Renk: ${cat.color}`);
    }
  }

  console.log('Sistem kategorileri işlemi tamamlandı.');

  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
