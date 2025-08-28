import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from './typeorm.config';
import { User } from './users/user.entity';
import * as bcrypt from 'bcrypt';
import { Account } from './accounts/account.entity';
import { Category } from './categories/category.entity';

async function run() {
  const ds = await (dataSource instanceof DataSource ? dataSource.initialize() : Promise.reject('Invalid data source'));

  const userRepo = ds.getRepository(User);
  const accRepo = ds.getRepository(Account);
  const catRepo = ds.getRepository(Category);

  // 1) User
  const email = 'salih@example.com';
  const name = 'Salih';
  const password = '12345678';
  let user = await userRepo.findOne({ where: { email } });
  if (!user) {
    user = userRepo.create({ email, name, passwordHash: await bcrypt.hash(password, 10) });
    await userRepo.save(user);
    console.log(`Seed: user ${email} oluşturuldu.`);
  } else {
    console.log(`Seed: user ${email} zaten var.`);
  }

  // 2) Account
  const accName = 'Vadesiz TL';
  let acc = await accRepo.findOne({ where: { owner: { id: user.id }, name: accName } });
  if (!acc) {
    acc = accRepo.create({ owner: user as any, name: accName, type: 'BANK', currency: 'TRY' });
    await accRepo.save(acc);
    console.log('Seed: account eklendi.');
  }

  // 3) Categories
  const defaults: Array<[string, 'INCOME' | 'EXPENSE']> = [
    ['Maaş', 'INCOME'],
    ['Faiz', 'INCOME'],
    ['Yemek', 'EXPENSE'],
    ['Ulaşım', 'EXPENSE'],
    ['Fatura', 'EXPENSE'],
  ];

  for (const [nameC, kind] of defaults) {
    const exists = await catRepo.findOne({ where: { owner: { id: user.id }, name: nameC, kind } });
    if (!exists) {
      const c = catRepo.create({ owner: user as any, name: nameC, kind });
      await catRepo.save(c);
      console.log(`Seed: kategori "${nameC}" (${kind}) eklendi.`);
    }
  }

  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});