import Account from '../models/Account.js';
import Expense from '../models/Expense.js';

export const updateAccountBalance = async (accountId) => {
    if (!accountId) return;
    try {
        const account = await Account.findById(accountId);
        if (!account) return;

        const expenses = await Expense.find({ account: accountId });
        let net = 0;
        for (const exp of expenses) {
            const amount = exp.convertedAmount !== undefined ? exp.convertedAmount : exp.amount;
            if (exp.type === 'INCOME') {
                net += amount;
            } else {
                net -= amount;
            }
        }
        account.balance = net;
        await account.save();
    } catch (err) {
        console.error('Error updating account balance:', err.message);
    }
};
