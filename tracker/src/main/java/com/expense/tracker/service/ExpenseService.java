package com.expense.tracker.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.expense.tracker.entity.Expense;
import com.expense.tracker.entity.User;
import com.expense.tracker.repository.ExpenseRepository;
import com.expense.tracker.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    // ✅ COMMON METHOD (REUSABLE)
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ✅ ADD EXPENSE
    public Expense addExpense(Expense expense, String email) {
        User user = getUserByEmail(email);
        expense.setUser(user);
        return expenseRepository.save(expense);
    }

    // ✅ GET EXPENSES
    public List<Expense> getExpenses(String email) {
        User user = getUserByEmail(email);
        return expenseRepository.findByUserId(user.getId());
    }

    // ✅ DELETE
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }

    // ✅ UPDATE (EDIT)
    public Expense updateExpense(Long id, Expense incoming, String email) {
        User user = getUserByEmail(email);

        Expense existing = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (existing.getUser() == null || !Objects.equals(existing.getUser().getId(), user.getId())) {
            throw new RuntimeException("Not allowed");
        }

        existing.setAmount(incoming.getAmount());
        existing.setCategory(incoming.getCategory());
        existing.setDate(incoming.getDate());
        existing.setDescription(incoming.getDescription());
        existing.setType(incoming.getType());

        return expenseRepository.save(existing);
    }

    // ✅ DASHBOARD SUMMARY
    public Map<String, Double> getSummary(String email) {

        User user = getUserByEmail(email);
        List<Expense> expenses = expenseRepository.findByUserId(user.getId());

        double income = expenses.stream()
                .filter(e -> e.getType().equalsIgnoreCase("INCOME"))
                .mapToDouble(Expense::getAmount)
                .sum();

        double expense = expenses.stream()
                .filter(e -> e.getType().equalsIgnoreCase("EXPENSE"))
                .mapToDouble(Expense::getAmount)
                .sum();

        Map<String, Double> result = new HashMap<>();
        result.put("income", income);
        result.put("expense", expense);
        result.put("balance", income - expense);

        return result;
    }

    // ✅ FILTER + SORT
    public List<Expense> filterExpenses(String email, String category,
                                        String startDate, String endDate,
                                        String sort) {

        User user = getUserByEmail(email);
        List<Expense> expenses = expenseRepository.findByUserId(user.getId());

        // Filter by category
        if (category != null) {
            expenses = expenses.stream()
                    .filter(e -> e.getCategory().equalsIgnoreCase(category))
                    .toList();
        }

        // Filter by date
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            expenses = expenses.stream()
                    .filter(e -> !e.getDate().isBefore(start) && !e.getDate().isAfter(end))
                    .toList();
        }

        // Sorting
        if ("asc".equalsIgnoreCase(sort)) {
            expenses = expenses.stream()
                    .sorted(Comparator.comparing(Expense::getDate))
                    .toList();
        } else if ("desc".equalsIgnoreCase(sort)) {
            expenses = expenses.stream()
                    .sorted(Comparator.comparing(Expense::getDate).reversed())
                    .toList();
        }

        return expenses;
    }

    // ✅ MONTHLY ANALYTICS
    public Map<String, Double> getMonthlyExpenses(String email) {

        User user = getUserByEmail(email);
        List<Expense> expenses = expenseRepository.findByUserId(user.getId());

        Map<String, Double> monthly = new HashMap<>();

        for (Expense e : expenses) {
            if (e.getType().equalsIgnoreCase("EXPENSE")) {
                String month = e.getDate().getMonth().toString();

                monthly.put(month,
                        monthly.getOrDefault(month, 0.0) + e.getAmount());
            }
        }

        return monthly;
    }

    // ✅ BUDGET CHECK
    public String checkBudget(String email, double limit) {

        double expense = getSummary(email).get("expense");

        if (expense > limit) {
            return "⚠️ Budget exceeded!";
        } else {
            return "✅ Within budget";
        }
    }

    // ✅ EXPORT CSV
    public String exportCSV(String email) {

        List<Expense> expenses = getExpenses(email);

        StringBuilder csv = new StringBuilder();
        csv.append("Amount,Category,Date,Type\n");

        for (Expense e : expenses) {
            csv.append(e.getAmount()).append(",")
                    .append(e.getCategory()).append(",")
                    .append(e.getDate()).append(",")
                    .append(e.getType()).append("\n");
        }

        return csv.toString();
    }
}