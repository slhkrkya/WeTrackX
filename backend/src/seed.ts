import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from './typeorm.config';
import { User } from './users/user.entity';
import * as bcrypt from 'bcrypt';

async function run() {
  const ds = await (dataSource instanceof DataSource
    ? dataSource.initialize()
    : Promise.reject('Invalid data source'));

  const userRepo = ds.getRepository(User);

  const users = [
    { name: 'Demo User', email: 'demo@demo.com', password: 'Demo123!' },
    { name: 'Salih Karakaya', email: 'salih@example.com', password: '12345678' },
  ];

  for (const u of users) {
    let user = await userRepo.findOne({ where: { email: u.email } });
    if (!user) {
      user = userRepo.create({
        name: u.name,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
      });
      await userRepo.save(user);
      console.log(`Seed: kullanıcı ${u.email} oluşturuldu.`);
    } else {
      console.log(`Seed: kullanıcı ${u.email} zaten var.`);
    }
  }

  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});