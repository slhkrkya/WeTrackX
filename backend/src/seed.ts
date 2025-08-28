import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from './typeorm.config';
import { User } from './users/user.entity';
import * as bcrypt from 'bcrypt';

async function run() {
  const ds = await (dataSource instanceof DataSource ? dataSource.initialize() : Promise.reject('Invalid data source'));

  const userRepo = ds.getRepository(User);

  const email = 'salih@example.com';
  const name = 'Salih';
  const password = '12345678';
  const exists = await userRepo.findOne({ where: { email } });

  if (exists) {
    console.log(`Seed: ${email} zaten var, atlanıyor.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const u = userRepo.create({ email, name, passwordHash });
    await userRepo.save(u);
    console.log(`Seed: ${email} oluşturuldu.`);
  }

  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
