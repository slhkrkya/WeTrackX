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
    { name: 'Maaş', priority: 10, color: '#10b981' },
    { name: 'Ek Gelir', priority: 9, color: '#059669' },
    { name: 'Yatırım Geliri', priority: 8, color: '#047857' },
    { name: 'Kira Geliri', priority: 7, color: '#065f46' },
    { name: 'Faiz Geliri', priority: 6, color: '#064e3b' },
    { name: 'Hediye', priority: 5, color: '#134e4a' },
    { name: 'İkramiye', priority: 4, color: '#16463d' },
    { name: 'Komisyon', priority: 3, color: '#14532d' },
    { name: 'Diğer Gelir', priority: 2, color: '#166534' },
  ];

  const systemExpenseCategories = [
    { name: 'Market', priority: 10, color: '#ef4444' },
    { name: 'Ulaşım', priority: 9, color: '#dc2626' },
    { name: 'Faturalar', priority: 8, color: '#b91c1c' },
    { name: 'Eğlence', priority: 7, color: '#991b1b' },
    { name: 'Sağlık', priority: 6, color: '#7f1d1d' },
    { name: 'Eğitim', priority: 5, color: '#450a0a' },
    { name: 'Giyim', priority: 4, color: '#dc2626' },
    { name: 'Ev & Mobilya', priority: 3, color: '#b91c1c' },
    { name: 'Teknoloji', priority: 2, color: '#991b1b' },
    { name: 'Spor & Hobi', priority: 1, color: '#7f1d1d' },
    { name: 'Seyahat', priority: 0, color: '#450a0a' },
    { name: 'Diğer Gider', priority: -1, color: '#dc2626' },
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
      });
      await catRepo.save(existingCat);
      console.log(`Sistem kategorisi oluşturuldu: ${cat.name} (Gelir)`);
    } else {
      console.log(`Sistem kategorisi zaten var: ${cat.name} (Gelir)`);
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
      });
      await catRepo.save(existingCat);
      console.log(`Sistem kategorisi oluşturuldu: ${cat.name} (Gider)`);
    } else {
      console.log(`Sistem kategorisi zaten var: ${cat.name} (Gider)`);
    }
  }

  console.log('Sistem kategorileri işlemi tamamlandı.');

  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
