import { User, Loan, Log, UserRole, LoanStatus, UserStatus } from '../types';

// This is mock data that simulates what would come from a Google Sheet via a serverless API.
const mockData = {
  users: [
    { id: 1, name: 'Admin User', username: 'admin', email: 'admin@microfin.com', role: UserRole.Admin, status: UserStatus.Active, password: 'admin' },
    { id: 2, name: 'Loan Officer', username: 'officer', email: 'officer@microfin.com', role: UserRole.Officer, status: UserStatus.Active, password: 'officer' },
    { id: 3, name: 'Maria Silva', username: 'maria', email: 'maria@example.com', role: UserRole.Borrower, status: UserStatus.Active, password: 'maria' },
    { id: 4, name: 'João Santos', username: 'joao', email: 'joao@example.com', role: UserRole.Borrower, status: UserStatus.Active, password: 'joao' },
    { id: 5, name: 'Carlos Moreira', username: 'carlos', email: 'carlos@example.com', role: UserRole.Borrower, status: UserStatus.Active, password: 'carlos' },
  ] as User[],
  loans: [
    {
      id: 'L10045', borrower: 'Maria Silva', borrowerId: 3, amount: 15000, interestRate: 30, term: 2, status: LoanStatus.Approved, date: '2023-06-15', purpose: 'Business Expansion',
      payments: [], documents: ['Loan Agreement - L10045.pdf', 'ID Card - Maria Silva.jpg']
    },
    {
      id: 'L10032', borrower: 'Carlos Moreira', borrowerId: 5, amount: 9000, interestRate: 40, term: 2, status: LoanStatus.Overdue, date: '2023-05-20', purpose: 'Personal Use',
      payments: [{ date: '2023-06-20', amount: 2520, principal: 1800, interest: 720, status: 'late', penalty: 90 }], documents: ['Loan Agreement - L10032.pdf']
    },
    {
      id: 'L10025', borrower: 'João Santos', borrowerId: 4, amount: 12000, interestRate: 30, term: 2, status: LoanStatus.Active, date: '2023-05-10', purpose: 'Education',
      payments: [{ date: '2023-06-10', amount: 3300, principal: 2400, interest: 900, status: 'paid' }], documents: ['Loan Agreement - L10025.pdf', 'Income Statement - João.xlsx']
    },
    {
      id: 'L10051', borrower: 'Maria Silva', borrowerId: 3, amount: 5000, interestRate: 40, term: 3, status: LoanStatus.Completed, date: '2023-02-01', purpose: 'Medical',
      payments: [
          { date: '2023-03-01', amount: 2333.33, principal: 1666.67, interest: 666.66, status: 'paid' },
          { date: '2023-04-01', amount: 2333.33, principal: 1666.67, interest: 666.66, status: 'paid' },
          { date: '2023-05-01', amount: 2333.34, principal: 1666.66, interest: 666.68, status: 'paid' },
      ], documents: []
    },
    {
      id: 'L10052', borrower: 'João Santos', borrowerId: 4, amount: 25000, interestRate: 30, term: 6, status: LoanStatus.Pending, date: '2023-06-28', purpose: 'Business Expansion',
      payments: [], documents: []
    },
  ],
  logs: [
    { timestamp: '2023-06-28 14:35:22', user: 'admin', action: 'Approved Loan', details: 'Approved loan #L10045 for Maria Silva', ip: '192.168.1.105' },
    { timestamp: '2023-06-28 13:22:45', user: 'system', action: 'Applied Penalty', details: 'Applied 1% late payment penalty to loan #L10032', ip: '127.0.0.1' },
    { timestamp: '2023-06-27 10:15:33', user: 'borrower', action: 'Made Payment', details: 'Made payment of 5,000 MZN for loan #L10025', ip: '198.51.100.42' },
    { timestamp: '2023-06-27 09:45:12', user: 'admin', action: 'User Login', details: 'Admin user logged in', ip: '192.168.1.105' },
  ],
};


// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getUsers = async (): Promise<User[]> => {
  await delay(200);
  // In a real app, this would be: `const res = await fetch('/api/users'); return res.json();`
  return Promise.resolve(JSON.parse(JSON.stringify(mockData.users)));
};

export const getLoans = async (): Promise<Loan[]> => {
  await delay(300);
  return Promise.resolve(JSON.parse(JSON.stringify(mockData.loans)));
};

export const getLogs = async (): Promise<Log[]> => {
  await delay(400);
  return Promise.resolve(JSON.parse(JSON.stringify(mockData.logs)));
};

export const saveUser = async (user: User): Promise<User> => {
    await delay(500);
    if (user.id) { // Update
        const index = mockData.users.findIndex(u => u.id === user.id);
        if (index > -1) mockData.users[index] = { ...mockData.users[index], ...user };
    } else { // Create
        const newUser = { ...user, id: Math.max(...mockData.users.map(u => u.id)) + 1 };
        mockData.users.push(newUser);
        return newUser;
    }
    return user;
};

export const deleteUser = async (userId: number): Promise<boolean> => {
    await delay(500);
    const index = mockData.users.findIndex(u => u.id === userId);
    if (index > -1) {
        mockData.users.splice(index, 1);
        return true;
    }
    return false;
};

export const saveLoan = async (application: { borrowerId: number; borrower: string; amount: number; term: number; purpose: string; }): Promise<Loan> => {
    await delay(500);
    
    const interestRate = application.amount < 10000 ? 40 : 30;

    const newLoan: Loan = {
        ...application,
        id: `L${Math.floor(Math.random() * 1000) + 10053}`, // new random id
        status: LoanStatus.Pending,
        date: new Date().toISOString().split('T')[0],
        interestRate: interestRate,
        payments: [],
        documents: [],
    };
    mockData.loans.push(newLoan);
    return newLoan;
};