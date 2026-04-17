import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';
import User from './models/User.js';
import Donor from './models/Donor.js';
import Donation from './models/Donation.js';
import Expenditure from './models/Expenditure.js';
import HouseVisit from './models/HouseVisit.js';
import Counter from './models/Counter.js';

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    await User.deleteMany();
    await Donor.deleteMany();
    await Donation.deleteMany();
    await Expenditure.deleteMany();
    await HouseVisit.deleteMany();
    await Counter.deleteMany();

    // Admin
    const admin = await User.create({
      name: 'Admin', email: 'admin@masjid.com', password: 'Admin@123',
      role: 'admin', assignedAreas: ['Qasim Nagar', 'Sultan Nagar', 'Peer Colony']
    });

    // 2 Committee members
    const member1 = await User.create({
      name: 'Ahmed Qasimi', email: 'ahmed@masjid.com', phone: '9876500001',
      password: 'Member@123', role: 'member', assignedAreas: ['Qasim Nagar']
    });
    const member2 = await User.create({
      name: 'Farhan Sultan', email: 'farhan@masjid.com', phone: '9876500002',
      password: 'Member@123', role: 'member', assignedAreas: ['Sultan Nagar', 'Peer Colony']
    });

    const areas = ['Qasim Nagar', 'Sultan Nagar', 'Peer Colony'];
    const collectors = [admin._id, member1._id, member2._id];
    const donorsData = [];
    for (let i = 1; i <= 10; i++) {
      donorsData.push({
        name: `Donor ${i}`,
        phone: `987654321${i % 10}`,
        address: { houseNo: `${i}A`, street: 'Main St', area: areas[i % 3] },
        area: areas[i % 3],
        fundType: i % 3 === 0 ? 'both' : (i % 2 === 0 ? 'masjid' : 'dargah'),
        monthlyAmount: 50 * i,
        isActive: true,
        createdBy: admin._id
      });
    }
    const createdDonors = [];
    for (const d of donorsData) { createdDonors.push(await Donor.create(d)); }

    // 3 months of donations
    for (let month = 1; month <= 3; month++) {
      const year = new Date().getFullYear();
      for (let j = 0; j < 5; j++) {
        const d = createdDonors[j];
        await Donation.create({
          donor: d._id, amount: d.monthlyAmount,
          fundType: d.fundType === 'both' ? 'masjid' : d.fundType,
          month, year, paymentDate: new Date(year, month - 1, 15),
          collectedBy: collectors[j % 3], collectionMethod: 'house_visit'
        });
      }
      if (month === 2) {
        await Donation.create({
          donor: createdDonors[6]._id, amount: 500,
          fundType: 'festival', festivalName: 'Ramadan 2025',
          month, year: new Date().getFullYear(),
          paymentDate: new Date(new Date().getFullYear(), 1, 20),
          collectedBy: admin._id, collectionMethod: 'walk_in'
        });
      }
    }

    // Expenditures
    const expData = [
      { fundType: 'masjid', category: 'imam_salary', description: 'Monthly Salary', amount: 3000, approvedBy: admin._id },
      { fundType: 'masjid', category: 'electricity', description: 'Power bill', amount: 500, approvedBy: admin._id },
      { fundType: 'dargah', category: 'maintenance', description: 'Repairs', amount: 1500, approvedBy: admin._id },
      { fundType: 'festival', festivalName: 'Ramadan 2025', category: 'event', description: 'Iftar setup', amount: 2000, approvedBy: admin._id },
      { fundType: 'masjid', category: 'cleaning', description: 'Janitorial supplies', amount: 200, approvedBy: admin._id },
    ];
    for (const ex of expData) { await Expenditure.create(ex); }

    console.log('Data Imported!');
    console.log('Admin:    admin@masjid.com / Admin@123');
    console.log('Member 1: ahmed@masjid.com / Member@123 (Qasim Nagar)');
    console.log('Member 2: farhan@masjid.com / Member@123 (Sultan Nagar, Peer Colony)');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
seedData();
