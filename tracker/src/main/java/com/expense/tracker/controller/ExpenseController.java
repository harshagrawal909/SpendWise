package com.expense.tracker.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.expense.tracker.entity.Expense;
import com.expense.tracker.service.ExpenseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public Expense addExpense(@RequestBody Expense expense, Principal principal) {
        return expenseService.addExpense(expense, principal.getName());
    }

    @GetMapping
    public List<Expense> getExpenses(Principal principal) {
        return expenseService.getExpenses(principal.getName());
    }

    @DeleteMapping("/{id}")
    public void deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
    }

    @PutMapping("/{id}")
    public Expense updateExpense(@PathVariable Long id, @RequestBody Expense expense, Principal principal) {
        return expenseService.updateExpense(id, expense, principal.getName());
    }

    @GetMapping("/summary")
    public Map<String, Double> getSummary(Principal principal) {
        return expenseService.getSummary(principal.getName());
    }

    @GetMapping("/filter")
    public List<Expense> filterExpenses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String sort,
            Principal principal) {

        return expenseService.filterExpenses(
                principal.getName(),
                category,
                startDate,
                endDate,
                sort
        );
    }

    @GetMapping("/monthly")
    public Map<String, Double> getMonthlyExpenses(Principal principal) {
        return expenseService.getMonthlyExpenses(principal.getName());
    }

    @GetMapping("/budget")
    public String checkBudget(@RequestParam double limit, Principal principal) {
        return expenseService.checkBudget(principal.getName(), limit);
    }

    @GetMapping("/export")
    public String exportCSV(Principal principal) {
        return expenseService.exportCSV(principal.getName());
    }
}