--
-- PostgreSQL database dump
--

\restrict DtJ1HUiVeWqDYy7YbOwLsKMl776ww1eCVBzFihJkxtFm2tf0URDn1e69eXpUgrW

-- Dumped from database version 18.6 (ac70818)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_assigned_by_fkey;
ALTER TABLE IF EXISTS ONLY public.subscription_invoices DROP CONSTRAINT IF EXISTS subscription_invoices_subscription_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscription_invoices DROP CONSTRAINT IF EXISTS subscription_invoices_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reminders DROP CONSTRAINT IF EXISTS reminders_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recurring_invoices DROP CONSTRAINT IF EXISTS recurring_invoices_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recurring_invoice_items DROP CONSTRAINT IF EXISTS recurring_invoice_items_recurring_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recurring_invoice_items DROP CONSTRAINT IF EXISTS recurring_invoice_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.receipts DROP CONSTRAINT IF EXISTS receipts_payment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.receipts DROP CONSTRAINT IF EXISTS receipts_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_contact_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotation_items DROP CONSTRAINT IF EXISTS quotation_items_quotation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotation_items DROP CONSTRAINT IF EXISTS quotation_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promotions DROP CONSTRAINT IF EXISTS promotions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.promotions DROP CONSTRAINT IF EXISTS promotions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_branch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_categories DROP CONSTRAINT IF EXISTS product_categories_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_vouchers DROP CONSTRAINT IF EXISTS payment_vouchers_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_vouchers DROP CONSTRAINT IF EXISTS payment_vouchers_expense_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_vouchers DROP CONSTRAINT IF EXISTS payment_vouchers_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_accounts DROP CONSTRAINT IF EXISTS loyalty_accounts_contact_id_fkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_accounts DROP CONSTRAINT IF EXISTS loyalty_accounts_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_debit_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_credit_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_quotation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration_connections DROP CONSTRAINT IF EXISTS integration_connections_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.group_permissions DROP CONSTRAINT IF EXISTS group_permissions_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS fk_group;
ALTER TABLE IF EXISTS ONLY public.fb_tables DROP CONSTRAINT IF EXISTS fb_tables_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_orders DROP CONSTRAINT IF EXISTS fb_orders_table_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_orders DROP CONSTRAINT IF EXISTS fb_orders_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_orders DROP CONSTRAINT IF EXISTS fb_orders_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_orders DROP CONSTRAINT IF EXISTS fb_orders_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_order_items DROP CONSTRAINT IF EXISTS fb_order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_order_items DROP CONSTRAINT IF EXISTS fb_order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_kots DROP CONSTRAINT IF EXISTS fb_kots_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fb_kots DROP CONSTRAINT IF EXISTS fb_kots_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contacts DROP CONSTRAINT IF EXISTS contacts_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_settings DROP CONSTRAINT IF EXISTS company_settings_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_module_settings DROP CONSTRAINT IF EXISTS company_module_settings_updated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.company_module_settings DROP CONSTRAINT IF EXISTS company_module_settings_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ck_sessions DROP CONSTRAINT IF EXISTS ck_sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ck_games DROP CONSTRAINT IF EXISTS ck_games_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_parent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_manager_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branch_stock DROP CONSTRAINT IF EXISTS branch_stock_variant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branch_stock DROP CONSTRAINT IF EXISTS branch_stock_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branch_stock DROP CONSTRAINT IF EXISTS branch_stock_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branch_stock DROP CONSTRAINT IF EXISTS branch_stock_branch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS "session_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_inviterId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS "account_userId_fkey";
DROP INDEX IF EXISTS public.ux_subscription_billing_period;
DROP INDEX IF EXISTS public.ux_promotions_code_company;
DROP INDEX IF EXISTS public.ux_product_variants_sku_company;
DROP INDEX IF EXISTS public.idx_vouchers_vendor_id;
DROP INDEX IF EXISTS public.idx_vouchers_rd_submission;
DROP INDEX IF EXISTS public.idx_vouchers_expense_id;
DROP INDEX IF EXISTS public.idx_vouchers_expense;
DROP INDEX IF EXISTS public.idx_subscription_events_company;
DROP INDEX IF EXISTS public.idx_services_company;
DROP INDEX IF EXISTS public.idx_reminders_company;
DROP INDEX IF EXISTS public.idx_quotations_company;
DROP INDEX IF EXISTS public.idx_promotions_dates;
DROP INDEX IF EXISTS public.idx_promotions_company;
DROP INDEX IF EXISTS public.idx_promotions_active;
DROP INDEX IF EXISTS public.idx_products_cost_price;
DROP INDEX IF EXISTS public.idx_products_company;
DROP INDEX IF EXISTS public.idx_product_variants_product;
DROP INDEX IF EXISTS public.idx_product_variants_company;
DROP INDEX IF EXISTS public.idx_product_variants_branch;
DROP INDEX IF EXISTS public.idx_product_variants_barcode;
DROP INDEX IF EXISTS public.idx_product_categories_company;
DROP INDEX IF EXISTS public.idx_payroll_entries_company_month;
DROP INDEX IF EXISTS public.idx_payments_invoice_id;
DROP INDEX IF EXISTS public.idx_payments_invoice;
DROP INDEX IF EXISTS public.idx_payments_company;
DROP INDEX IF EXISTS public.idx_payment_vouchers_company;
DROP INDEX IF EXISTS public.idx_loyalty_tx_ref;
DROP INDEX IF EXISTS public.idx_loyalty_tx_company;
DROP INDEX IF EXISTS public.idx_loyalty_tx_account;
DROP INDEX IF EXISTS public.idx_loyalty_accounts_contact;
DROP INDEX IF EXISTS public.idx_loyalty_accounts_company;
DROP INDEX IF EXISTS public.idx_journal_reference;
DROP INDEX IF EXISTS public.idx_journal_ref;
DROP INDEX IF EXISTS public.idx_journal_entries_reference_type_id;
DROP INDEX IF EXISTS public.idx_journal_entries_fiscal_year_month;
DROP INDEX IF EXISTS public.idx_journal_entries_document_number;
DROP INDEX IF EXISTS public.idx_journal_entries_debit_account_id;
DROP INDEX IF EXISTS public.idx_journal_entries_credit_account_id;
DROP INDEX IF EXISTS public.idx_journal_entries_company;
DROP INDEX IF EXISTS public.idx_invoices_rd_submission;
DROP INDEX IF EXISTS public.idx_invoices_company;
DROP INDEX IF EXISTS public.idx_intconn_provider;
DROP INDEX IF EXISTS public.idx_intconn_company;
DROP INDEX IF EXISTS public.idx_groups_name;
DROP INDEX IF EXISTS public.idx_fb_tables_company;
DROP INDEX IF EXISTS public.idx_fb_orders_table;
DROP INDEX IF EXISTS public.idx_fb_orders_company;
DROP INDEX IF EXISTS public.idx_fb_order_items_order;
DROP INDEX IF EXISTS public.idx_fb_kots_order;
DROP INDEX IF EXISTS public.idx_expenses_status;
DROP INDEX IF EXISTS public.idx_expenses_date;
DROP INDEX IF EXISTS public.idx_expenses_company;
DROP INDEX IF EXISTS public.idx_expenses_category;
DROP INDEX IF EXISTS public.idx_contacts_company;
DROP INDEX IF EXISTS public.idx_companies_license_key;
DROP INDEX IF EXISTS public.idx_companies_business_type;
DROP INDEX IF EXISTS public.idx_branches_company;
DROP INDEX IF EXISTS public.idx_branches_active;
DROP INDEX IF EXISTS public.idx_branch_stock_product;
DROP INDEX IF EXISTS public.idx_branch_stock_company;
DROP INDEX IF EXISTS public.idx_branch_stock_branch;
DROP INDEX IF EXISTS public.idx_ai_alerts_status;
DROP INDEX IF EXISTS public.idx_ai_alerts_severity;
DROP INDEX IF EXISTS public.idx_ai_alerts_dedup;
DROP INDEX IF EXISTS public.company_settings_company_id_key;
DROP INDEX IF EXISTS public.ck_sessions_user_idx;
DROP INDEX IF EXISTS public.ck_games_user_idx;
DROP INDEX IF EXISTS public.ck_games_created_idx;
DROP INDEX IF EXISTS neon_auth.verification_identifier_idx;
DROP INDEX IF EXISTS neon_auth."session_userId_idx";
DROP INDEX IF EXISTS neon_auth.organization_slug_uidx;
DROP INDEX IF EXISTS neon_auth."member_userId_idx";
DROP INDEX IF EXISTS neon_auth."member_organizationId_idx";
DROP INDEX IF EXISTS neon_auth."invitation_organizationId_idx";
DROP INDEX IF EXISTS neon_auth.invitation_email_idx;
DROP INDEX IF EXISTS neon_auth."account_userId_idx";
ALTER TABLE IF EXISTS ONLY public.wht_records DROP CONSTRAINT IF EXISTS wht_records_pkey;
ALTER TABLE IF EXISTS ONLY public.users_backup_1773898881424 DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey1;
ALTER TABLE IF EXISTS ONLY public.users_backup_1773898881424 DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_user_id_key;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_user_id_group_id_key;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.user_groups DROP CONSTRAINT IF EXISTS user_groups_group_id_key;
ALTER TABLE IF EXISTS ONLY public.subscription_invoices DROP CONSTRAINT IF EXISTS subscription_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_service_code_key;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.reminders DROP CONSTRAINT IF EXISTS reminders_pkey;
ALTER TABLE IF EXISTS ONLY public.recurring_invoices DROP CONSTRAINT IF EXISTS recurring_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.recurring_invoice_items DROP CONSTRAINT IF EXISTS recurring_invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.receipts DROP CONSTRAINT IF EXISTS receipts_receipt_number_key;
ALTER TABLE IF EXISTS ONLY public.receipts DROP CONSTRAINT IF EXISTS receipts_pkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_quotation_number_key;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_pkey;
ALTER TABLE IF EXISTS ONLY public.quotation_items DROP CONSTRAINT IF EXISTS quotation_items_pkey;
ALTER TABLE IF EXISTS ONLY public.promotions DROP CONSTRAINT IF EXISTS promotions_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_sku_number_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_sku_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_pkey;
ALTER TABLE IF EXISTS ONLY public.product_categories DROP CONSTRAINT IF EXISTS product_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.product_categories DROP CONSTRAINT IF EXISTS product_categories_name_key;
ALTER TABLE IF EXISTS ONLY public.payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_payment_no_key;
ALTER TABLE IF EXISTS ONLY public.payment_vouchers DROP CONSTRAINT IF EXISTS payment_vouchers_pkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_accounts DROP CONSTRAINT IF EXISTS loyalty_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.loyalty_accounts DROP CONSTRAINT IF EXISTS loyalty_accounts_company_id_contact_id_key;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.integration_connections DROP CONSTRAINT IF EXISTS integration_connections_pkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_pkey;
ALTER TABLE IF EXISTS ONLY public.group_permissions DROP CONSTRAINT IF EXISTS group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.group_permissions DROP CONSTRAINT IF EXISTS group_permissions_module_key;
ALTER TABLE IF EXISTS ONLY public.group_permissions DROP CONSTRAINT IF EXISTS group_permissions_group_id_module_key;
ALTER TABLE IF EXISTS ONLY public.group_permissions DROP CONSTRAINT IF EXISTS group_permissions_group_id_key;
ALTER TABLE IF EXISTS ONLY public.fb_tables DROP CONSTRAINT IF EXISTS fb_tables_pkey;
ALTER TABLE IF EXISTS ONLY public.fb_tables DROP CONSTRAINT IF EXISTS fb_tables_company_id_code_key;
ALTER TABLE IF EXISTS ONLY public.fb_orders DROP CONSTRAINT IF EXISTS fb_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.fb_order_items DROP CONSTRAINT IF EXISTS fb_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.fb_kots DROP CONSTRAINT IF EXISTS fb_kots_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_expense_number_key;
ALTER TABLE IF EXISTS ONLY public.document_patterns DROP CONSTRAINT IF EXISTS document_patterns_pkey;
ALTER TABLE IF EXISTS ONLY public.document_patterns DROP CONSTRAINT IF EXISTS document_patterns_document_type_key;
ALTER TABLE IF EXISTS ONLY public.contacts DROP CONSTRAINT IF EXISTS contacts_pkey;
ALTER TABLE IF EXISTS ONLY public.company_settings DROP CONSTRAINT IF EXISTS company_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.company DROP CONSTRAINT IF EXISTS company_pkey;
ALTER TABLE IF EXISTS ONLY public.company_module_settings DROP CONSTRAINT IF EXISTS company_module_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE IF EXISTS ONLY public.ck_users DROP CONSTRAINT IF EXISTS ck_users_username_key;
ALTER TABLE IF EXISTS ONLY public.ck_users DROP CONSTRAINT IF EXISTS ck_users_pkey;
ALTER TABLE IF EXISTS ONLY public.ck_sessions DROP CONSTRAINT IF EXISTS ck_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.ck_games DROP CONSTRAINT IF EXISTS ck_games_pkey;
ALTER TABLE IF EXISTS ONLY public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_account_code_key;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_pkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_company_id_code_key;
ALTER TABLE IF EXISTS ONLY public.branch_stock DROP CONSTRAINT IF EXISTS branch_stock_pkey;
ALTER TABLE IF EXISTS ONLY public.branch_stock DROP CONSTRAINT IF EXISTS branch_stock_branch_id_product_id_variant_id_key;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_pkey;
ALTER TABLE IF EXISTS ONLY public.assets DROP CONSTRAINT IF EXISTS assets_asset_number_key;
ALTER TABLE IF EXISTS ONLY public.ai_alerts DROP CONSTRAINT IF EXISTS ai_alerts_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_log DROP CONSTRAINT IF EXISTS activity_log_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_code_key;
ALTER TABLE IF EXISTS ONLY neon_auth.verification DROP CONSTRAINT IF EXISTS verification_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_email_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_token_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_endpoint_id_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_slug_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS member_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.jwks DROP CONSTRAINT IF EXISTS jwks_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS invitation_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS account_pkey;
ALTER TABLE IF EXISTS public.wht_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users_backup_1773898881424 ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subscription_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subscription_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.services ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reminders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.recurring_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.recurring_invoice_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.receipts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotation_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promotions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.product_variants ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.product_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payroll_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payment_vouchers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.loyalty_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.loyalty_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.journal_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.invoice_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.integration_connections ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.group_permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fb_tables ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fb_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fb_order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fb_kots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.document_patterns ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contacts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.companies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ck_users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ck_games ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.branches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.branch_stock ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bookings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bank_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ai_alerts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.activity_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.accounts ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.wht_records_id_seq;
DROP TABLE IF EXISTS public.wht_records;
DROP SEQUENCE IF EXISTS public.users_backup_1773898881424_id_seq;
DROP TABLE IF EXISTS public.users_backup_1773898881424;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.users_id_seq1;
DROP SEQUENCE IF EXISTS public.user_groups_id_seq;
DROP TABLE IF EXISTS public.user_groups;
DROP SEQUENCE IF EXISTS public.subscription_invoices_id_seq;
DROP TABLE IF EXISTS public.subscription_invoices;
DROP SEQUENCE IF EXISTS public.subscription_events_id_seq;
DROP TABLE IF EXISTS public.subscription_events;
DROP SEQUENCE IF EXISTS public.services_id_seq;
DROP TABLE IF EXISTS public.services;
DROP SEQUENCE IF EXISTS public.reminders_id_seq;
DROP TABLE IF EXISTS public.reminders;
DROP SEQUENCE IF EXISTS public.recurring_invoices_id_seq;
DROP TABLE IF EXISTS public.recurring_invoices;
DROP SEQUENCE IF EXISTS public.recurring_invoice_items_id_seq;
DROP TABLE IF EXISTS public.recurring_invoice_items;
DROP SEQUENCE IF EXISTS public.receipts_id_seq;
DROP TABLE IF EXISTS public.receipts;
DROP SEQUENCE IF EXISTS public.quotations_id_seq;
DROP TABLE IF EXISTS public.quotations;
DROP SEQUENCE IF EXISTS public.quotation_items_id_seq;
DROP TABLE IF EXISTS public.quotation_items;
DROP SEQUENCE IF EXISTS public.promotions_id_seq;
DROP TABLE IF EXISTS public.promotions;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.product_variants_id_seq;
DROP TABLE IF EXISTS public.product_variants;
DROP SEQUENCE IF EXISTS public.product_categories_id_seq;
DROP TABLE IF EXISTS public.product_categories;
DROP SEQUENCE IF EXISTS public.payroll_entries_id_seq;
DROP TABLE IF EXISTS public.payroll_entries;
DROP SEQUENCE IF EXISTS public.payments_id_seq;
DROP TABLE IF EXISTS public.payments;
DROP SEQUENCE IF EXISTS public.payment_vouchers_id_seq;
DROP TABLE IF EXISTS public.payment_vouchers;
DROP SEQUENCE IF EXISTS public.loyalty_transactions_id_seq;
DROP TABLE IF EXISTS public.loyalty_transactions;
DROP SEQUENCE IF EXISTS public.loyalty_accounts_id_seq;
DROP TABLE IF EXISTS public.loyalty_accounts;
DROP SEQUENCE IF EXISTS public.journal_entries_id_seq;
DROP TABLE IF EXISTS public.journal_entries;
DROP SEQUENCE IF EXISTS public.invoices_id_seq;
DROP TABLE IF EXISTS public.invoices;
DROP SEQUENCE IF EXISTS public.invoice_items_id_seq;
DROP TABLE IF EXISTS public.invoice_items;
DROP SEQUENCE IF EXISTS public.integration_connections_id_seq;
DROP TABLE IF EXISTS public.integration_connections;
DROP SEQUENCE IF EXISTS public.groups_id_seq;
DROP TABLE IF EXISTS public.groups;
DROP SEQUENCE IF EXISTS public.group_permissions_id_seq;
DROP TABLE IF EXISTS public.group_permissions;
DROP SEQUENCE IF EXISTS public.fb_tables_id_seq;
DROP TABLE IF EXISTS public.fb_tables;
DROP SEQUENCE IF EXISTS public.fb_orders_id_seq;
DROP TABLE IF EXISTS public.fb_orders;
DROP SEQUENCE IF EXISTS public.fb_order_items_id_seq;
DROP TABLE IF EXISTS public.fb_order_items;
DROP SEQUENCE IF EXISTS public.fb_kots_id_seq;
DROP TABLE IF EXISTS public.fb_kots;
DROP SEQUENCE IF EXISTS public.expenses_id_seq;
DROP TABLE IF EXISTS public.expenses;
DROP SEQUENCE IF EXISTS public.document_patterns_id_seq;
DROP TABLE IF EXISTS public.document_patterns;
DROP SEQUENCE IF EXISTS public.contacts_id_seq;
DROP TABLE IF EXISTS public.contacts;
DROP SEQUENCE IF EXISTS public.company_settings_id_seq;
DROP TABLE IF EXISTS public.company_settings;
DROP TABLE IF EXISTS public.company_module_settings;
DROP SEQUENCE IF EXISTS public.company_id_seq;
DROP TABLE IF EXISTS public.company;
DROP SEQUENCE IF EXISTS public.companies_id_seq;
DROP TABLE IF EXISTS public.companies;
DROP SEQUENCE IF EXISTS public.ck_users_id_seq;
DROP TABLE IF EXISTS public.ck_users;
DROP TABLE IF EXISTS public.ck_sessions;
DROP SEQUENCE IF EXISTS public.ck_games_id_seq;
DROP TABLE IF EXISTS public.ck_games;
DROP TABLE IF EXISTS public.chart_of_accounts;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.branches_id_seq;
DROP TABLE IF EXISTS public.branches;
DROP SEQUENCE IF EXISTS public.branch_stock_id_seq;
DROP TABLE IF EXISTS public.branch_stock;
DROP SEQUENCE IF EXISTS public.bookings_id_seq;
DROP TABLE IF EXISTS public.bookings;
DROP SEQUENCE IF EXISTS public.bank_accounts_id_seq;
DROP TABLE IF EXISTS public.bank_accounts;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.assets_id_seq;
DROP TABLE IF EXISTS public.assets;
DROP SEQUENCE IF EXISTS public.ai_alerts_id_seq;
DROP TABLE IF EXISTS public.ai_alerts;
DROP SEQUENCE IF EXISTS public.activity_log_id_seq;
DROP TABLE IF EXISTS public.activity_log;
DROP SEQUENCE IF EXISTS public.accounts_id_seq;
DROP TABLE IF EXISTS public.accounts;
DROP TABLE IF EXISTS neon_auth.verification;
DROP TABLE IF EXISTS neon_auth."user";
DROP TABLE IF EXISTS neon_auth.session;
DROP TABLE IF EXISTS neon_auth.project_config;
DROP TABLE IF EXISTS neon_auth.organization;
DROP TABLE IF EXISTS neon_auth.member;
DROP TABLE IF EXISTS neon_auth.jwks;
DROP TABLE IF EXISTS neon_auth.invitation;
DROP TABLE IF EXISTS neon_auth.account;
DROP FUNCTION IF EXISTS pgrst.pre_config();
DROP SCHEMA IF EXISTS pgrst;
DROP SCHEMA IF EXISTS neon_auth;
DROP EXTENSION IF EXISTS pg_session_jwt;
--
-- Name: pg_session_jwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_session_jwt WITH SCHEMA public;


--
-- Name: EXTENSION pg_session_jwt; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_session_jwt IS 'pg_session_jwt: manage authentication sessions using JWTs';


--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: pgrst; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgrst;


--
-- Name: pre_config(); Type: FUNCTION; Schema: pgrst; Owner: -
--

CREATE FUNCTION pgrst.pre_config() RETURNS void
    LANGUAGE sql
    SET search_path TO ''
    AS $$
  SELECT
      set_config('pgrst.db_schemas', 'public', true)
    , set_config('pgrst.db_aggregates_enabled', 'true', true)
    , set_config('pgrst.db_anon_role', 'anonymous', true)
    , set_config('pgrst.jwt_role_claim_key', '.role', true)
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone,
    alg text,
    crv text
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_log (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;


--
-- Name: ai_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_alerts (
    id integer NOT NULL,
    severity character varying(10) DEFAULT 'info'::character varying NOT NULL,
    category character varying(50) NOT NULL,
    title text NOT NULL,
    detail text,
    recommendation text,
    reference_id integer,
    reference_label character varying(50),
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    dedup_key character varying(150),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone
);


--
-- Name: ai_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_alerts_id_seq OWNED BY public.ai_alerts.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    asset_number character varying,
    name character varying,
    category character varying,
    description character varying,
    acquisition_date character varying,
    acquisition_cost double precision,
    current_value double precision,
    depreciation_method character varying,
    useful_life_years integer,
    accumulated_depreciation double precision,
    location character varying,
    status character varying,
    notes character varying
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "timestamp" character varying,
    "user" character varying,
    action character varying,
    detail character varying
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_accounts (
    id integer NOT NULL,
    bank_name character varying,
    account_number character varying,
    account_name character varying,
    branch character varying,
    is_default boolean
);


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_accounts_id_seq OWNED BY public.bank_accounts.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    product_id integer,
    user_id integer,
    qty integer,
    status character varying,
    booked_at character varying,
    expiry_at character varying
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: branch_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch_stock (
    id integer NOT NULL,
    company_id integer NOT NULL,
    branch_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    stock_quantity integer DEFAULT 0,
    stock_qty integer DEFAULT 0,
    min_stock_level integer DEFAULT 5,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: branch_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branch_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branch_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branch_stock_id_seq OWNED BY public.branch_stock.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    company_id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(50),
    manager_user_id integer,
    is_main boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying,
    description character varying,
    type character varying
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: chart_of_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_of_accounts (
    id integer NOT NULL,
    account_code character varying(10) NOT NULL,
    account_name_th character varying(255) NOT NULL,
    account_name_en character varying(255),
    account_type character varying(20) NOT NULL,
    account_category character varying(50),
    parent_id integer,
    is_active boolean DEFAULT true,
    is_contra boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ck_games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ck_games (
    id integer NOT NULL,
    user_id integer NOT NULL,
    result text NOT NULL,
    difficulty text NOT NULL,
    moves integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_games_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
    CONSTRAINT ck_games_result_check CHECK ((result = ANY (ARRAY['win'::text, 'loss'::text, 'draw'::text])))
);


--
-- Name: ck_games_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ck_games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ck_games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ck_games_id_seq OWNED BY public.ck_games.id;


--
-- Name: ck_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ck_sessions (
    token text NOT NULL,
    user_id integer NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: ck_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ck_users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ck_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ck_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ck_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ck_users_id_seq OWNED BY public.ck_users.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    plan_type character varying(50) DEFAULT 'FREE'::character varying NOT NULL,
    max_users integer DEFAULT 1 NOT NULL,
    subscription_status character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    expiry_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    license_key text,
    customer_name character varying(255),
    customer_email character varying(255),
    customer_phone character varying(50),
    price_amount numeric(12,2) DEFAULT 0,
    price_currency character varying(10) DEFAULT 'THB'::character varying,
    trial_end timestamp with time zone,
    last_renewed_at timestamp with time zone,
    notes text,
    business_type character varying(30) DEFAULT 'general'::character varying,
    CONSTRAINT companies_business_type_check CHECK (((business_type)::text = ANY ((ARRAY['general'::character varying, 'retail'::character varying, 'fnb'::character varying, 'pharmacy'::character varying, 'service'::character varying])::text[])))
);


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    id integer NOT NULL,
    name character varying,
    tax_id character varying,
    address character varying,
    phone character varying,
    email character varying,
    logo_base64 character varying,
    vat_rate double precision,
    withholding_tax_rate double precision,
    corporate_tax_rate double precision,
    tax_exemption_years integer,
    tax_reduction_years integer,
    tax_exemption_start_year integer,
    currency character varying,
    inv_prefix character varying,
    rec_prefix character varying,
    pay_prefix character varying,
    exp_prefix character varying,
    quo_prefix character varying,
    smtp_server character varying,
    smtp_port integer,
    smtp_user character varying,
    smtp_pass character varying,
    smtp_use_tls boolean,
    email_sender character varying,
    is_setup boolean,
    google_service_account_json character varying,
    google_authorized_email character varying,
    last_google_sync character varying
);


--
-- Name: company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_id_seq OWNED BY public.company.id;


--
-- Name: company_module_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_module_settings (
    company_id integer NOT NULL,
    module_id character varying(100) NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    tax_id character varying(50),
    phone character varying(50),
    email character varying(255),
    logo_url text,
    website character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    bank_name character varying(255),
    bank_account_name character varying(255),
    bank_account_number character varying(100),
    bank_branch character varying(255),
    vat_rate numeric(5,2) DEFAULT 7.00,
    withholding_tax_rate numeric(5,2) DEFAULT 3.00,
    is_vat_registered boolean DEFAULT true,
    currency character varying(10) DEFAULT 'THB'::character varying,
    invoice_prefix character varying(20) DEFAULT 'INV'::character varying,
    quotation_prefix character varying(20) DEFAULT 'QT'::character varying,
    google_client_id character varying(255),
    google_client_secret character varying(255),
    google_refresh_token text,
    google_redirect_uri character varying(255) DEFAULT 'https://developers.google.com/oauthplayground'::character varying,
    google_drive_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer,
    receipt_prefix character varying(20) DEFAULT 'REC'::character varying,
    journal_prefix character varying(20) DEFAULT 'GJ'::character varying,
    invoice_footer text,
    quotation_footer text,
    receipt_footer text,
    rd_client_id character varying(255),
    rd_client_secret character varying(255),
    rd_api_key character varying(255),
    rd_base_url character varying(255) DEFAULT 'https://api-portal.rd.go.th'::character varying,
    rd_enabled boolean DEFAULT false
);


--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    name character varying NOT NULL,
    type character varying,
    tax_id character varying,
    address character varying,
    phone character varying,
    email character varying,
    contact_person character varying,
    is_active boolean,
    contact_type character varying(20),
    company_id integer
);


--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: document_patterns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_patterns (
    id integer NOT NULL,
    document_type character varying(20) NOT NULL,
    prefix character varying(20) NOT NULL,
    include_year boolean DEFAULT true,
    include_month boolean DEFAULT true,
    separator character varying(5) DEFAULT '-'::character varying,
    digits integer DEFAULT 4,
    last_number integer DEFAULT 0,
    current_pattern character varying(50),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: document_patterns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_patterns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_patterns_id_seq OWNED BY public.document_patterns.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    expense_number character varying,
    category character varying,
    description character varying,
    amount numeric(15,2),
    vat_amount numeric(15,2),
    withholding_tax_amount numeric(15,2),
    net_amount numeric(15,2),
    expense_date date,
    vendor character varying,
    wht_type character varying,
    payment_method character varying,
    receipt_base64 character varying,
    tax_deductible boolean,
    notes character varying,
    status character varying(50) DEFAULT 'paid'::character varying,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tax_invoice_no character varying(100),
    tax_invoice_date date,
    contact_id integer,
    classification character varying(20) DEFAULT 'OPEX'::character varying NOT NULL,
    receipt_url text,
    receipt_file_name character varying(255),
    receipt_mime_type character varying(100),
    pp36_exempt boolean DEFAULT false NOT NULL,
    company_id integer,
    reference_no character varying(100),
    wht_rate numeric(5,2) DEFAULT 0,
    wht_amount numeric(15,2) DEFAULT 0,
    is_service boolean DEFAULT false,
    original_currency character varying(10) DEFAULT 'THB'::character varying,
    original_amount numeric(15,4) DEFAULT NULL::numeric,
    exchange_rate numeric(15,6) DEFAULT NULL::numeric
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: fb_kots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fb_kots (
    id integer NOT NULL,
    company_id integer NOT NULL,
    order_id integer NOT NULL,
    kot_number character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    items_json text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fb_kots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fb_kots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fb_kots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fb_kots_id_seq OWNED BY public.fb_kots.id;


--
-- Name: fb_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fb_order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer,
    description character varying(255) NOT NULL,
    qty numeric(10,2) DEFAULT 1,
    price numeric(15,2) DEFAULT 0,
    total numeric(15,2) DEFAULT 0,
    notes text,
    kot_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fb_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fb_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fb_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fb_order_items_id_seq OWNED BY public.fb_order_items.id;


--
-- Name: fb_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fb_orders (
    id integer NOT NULL,
    company_id integer NOT NULL,
    table_id integer,
    order_number character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying,
    subtotal numeric(15,2) DEFAULT 0,
    discount numeric(15,2) DEFAULT 0,
    vat numeric(15,2) DEFAULT 0,
    total numeric(15,2) DEFAULT 0,
    notes text,
    invoice_id integer,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    closed_at timestamp with time zone
);


--
-- Name: fb_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fb_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fb_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fb_orders_id_seq OWNED BY public.fb_orders.id;


--
-- Name: fb_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fb_tables (
    id integer NOT NULL,
    company_id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    seats integer DEFAULT 2,
    zone character varying(50),
    status character varying(20) DEFAULT 'free'::character varying,
    current_order_id integer,
    pos_x integer DEFAULT 0,
    pos_y integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fb_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fb_tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fb_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fb_tables_id_seq OWNED BY public.fb_tables.id;


--
-- Name: group_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_permissions (
    id integer NOT NULL,
    group_id integer NOT NULL,
    module character varying(50) NOT NULL,
    can_create boolean DEFAULT false,
    can_read boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_export boolean DEFAULT false,
    can_manage boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_permissions_id_seq OWNED BY public.group_permissions.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_system boolean DEFAULT false,
    color character varying(7) DEFAULT '#6366f1'::character varying,
    created_by integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: integration_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_connections (
    id integer NOT NULL,
    company_id integer NOT NULL,
    provider character varying(50) NOT NULL,
    category character varying(20) NOT NULL,
    name character varying(255),
    credentials jsonb,
    settings jsonb,
    status character varying(20) DEFAULT 'disconnected'::character varying,
    last_sync_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: integration_connections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.integration_connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: integration_connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.integration_connections_id_seq OWNED BY public.integration_connections.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer,
    product_id integer,
    quantity integer,
    unit_price double precision,
    discount_percent double precision,
    total_price double precision,
    description character varying
);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number character varying,
    customer_id integer,
    user_id integer,
    total_amount double precision,
    vat_amount double precision,
    discount_amount double precision,
    net_amount double precision,
    status character varying,
    created_at timestamp without time zone,
    due_date date,
    notes character varying,
    contact_id integer,
    rd_submission_id character varying(255),
    rd_status character varying(50),
    rd_submitted_at timestamp with time zone,
    rd_error_message text,
    issue_date date,
    quotation_id integer,
    company_id integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_service boolean DEFAULT false
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id integer NOT NULL,
    entry_date date,
    reference_no character varying(50),
    account_name character varying(255),
    description text,
    debit numeric(15,2) DEFAULT '0'::numeric,
    credit numeric(15,2) DEFAULT '0'::numeric,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    receipt_url text,
    journal_type character varying(20) DEFAULT 'general'::character varying,
    reference_type character varying(50),
    reference_id integer,
    debit_account_id integer,
    credit_account_id integer,
    amount numeric(15,2),
    vat_rate numeric(5,2) DEFAULT '0'::numeric,
    vat_amount numeric(15,2) DEFAULT '0'::numeric,
    withholding_rate numeric(5,2) DEFAULT '0'::numeric,
    withholding_amount numeric(15,2) DEFAULT '0'::numeric,
    fiscal_year integer,
    fiscal_month integer,
    document_number character varying(50),
    notes text,
    company_id integer
);


--
-- Name: journal_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journal_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journal_entries_id_seq OWNED BY public.journal_entries.id;


--
-- Name: loyalty_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_accounts (
    id integer NOT NULL,
    company_id integer NOT NULL,
    contact_id integer NOT NULL,
    tier character varying(20) DEFAULT 'bronze'::character varying,
    points_balance integer DEFAULT 0,
    lifetime_points integer DEFAULT 0,
    total_spent numeric(15,2) DEFAULT 0,
    member_since timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: loyalty_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loyalty_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loyalty_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loyalty_accounts_id_seq OWNED BY public.loyalty_accounts.id;


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_transactions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    account_id integer NOT NULL,
    tx_type character varying(20) NOT NULL,
    points integer NOT NULL,
    balance_after integer,
    reference_type character varying(30),
    reference_id integer,
    description text,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loyalty_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loyalty_transactions_id_seq OWNED BY public.loyalty_transactions.id;


--
-- Name: payment_vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_vouchers (
    id integer NOT NULL,
    voucher_no character varying(50),
    issue_date date,
    payee_name character varying(255),
    amount numeric(15,2),
    payment_method character varying(100),
    description text,
    status character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    receipt_url text,
    rd_submission_id character varying(255),
    rd_status character varying(50),
    rd_submitted_at timestamp with time zone,
    rd_error_message text,
    expense_id integer,
    vendor_id integer,
    company_id integer,
    vat_amount numeric(15,2) DEFAULT 0,
    tax_id character varying(50),
    wht_amount numeric(15,2) DEFAULT 0
);


--
-- Name: payment_vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_vouchers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_vouchers_id_seq OWNED BY public.payment_vouchers.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer,
    amount numeric(15,2),
    payment_date date,
    payment_method character varying,
    reference_number character varying,
    notes character varying,
    company_id integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_no character varying(50),
    status character varying(20) DEFAULT 'completed'::character varying,
    wht_amount numeric(15,2) DEFAULT 0,
    vat_amount numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: payroll_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_entries (
    id integer NOT NULL,
    company_id integer NOT NULL,
    employee_code character varying(100),
    employee_name character varying(255) NOT NULL,
    payroll_month date NOT NULL,
    gross_amount numeric(15,2) DEFAULT 0 NOT NULL,
    tax_withheld numeric(15,2) DEFAULT 0 NOT NULL,
    net_amount numeric(15,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'THB'::character varying NOT NULL,
    source_system character varying(100) DEFAULT 'manual'::character varying NOT NULL,
    external_ref character varying(150),
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payroll_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payroll_entries_id_seq OWNED BY public.payroll_entries.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer
);


--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    company_id integer NOT NULL,
    product_id integer NOT NULL,
    branch_id integer,
    sku_variant character varying(100),
    barcode character varying(100),
    variant_name character varying(255),
    color character varying(50),
    size character varying(50),
    attr_type character varying(50),
    price_override numeric(15,2),
    cost_price_override numeric(15,2),
    stock_quantity integer DEFAULT 0,
    stock_qty integer DEFAULT 0,
    min_stock_level integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    sku character varying,
    name character varying,
    description character varying,
    price double precision,
    stock_qty integer,
    unit character varying,
    category_id integer,
    type character varying DEFAULT 'physical'::character varying,
    sku_number character varying(100),
    source_info text,
    storage_location text,
    product_notes text,
    stock_quantity integer DEFAULT 0,
    category_name character varying(255),
    cost_price numeric(15,2) DEFAULT '0'::numeric,
    company_id integer
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    code character varying(50),
    name character varying(255) NOT NULL,
    description text,
    promo_type character varying(20) DEFAULT 'percentage'::character varying NOT NULL,
    value numeric(15,2) DEFAULT 0,
    min_purchase numeric(15,2) DEFAULT 0,
    max_discount numeric(15,2),
    applies_to character varying(20) DEFAULT 'all'::character varying,
    applies_ids text,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    usage_limit integer,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promotions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;


--
-- Name: quotation_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_items (
    id integer NOT NULL,
    quotation_id integer,
    product_id integer,
    quantity integer,
    unit_price double precision,
    discount_percent double precision,
    total_price double precision,
    description character varying
);


--
-- Name: quotation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotation_items_id_seq OWNED BY public.quotation_items.id;


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotations (
    id integer NOT NULL,
    quotation_number character varying,
    customer_id integer,
    user_id integer,
    total_amount double precision,
    vat_amount double precision,
    discount_amount double precision,
    net_amount double precision,
    status character varying,
    created_at character varying,
    expiry_date character varying,
    notes character varying,
    contact_id integer,
    is_recurring boolean DEFAULT false,
    recurring_interval character varying(20) DEFAULT 'none'::character varying,
    company_id integer,
    issue_date date
);


--
-- Name: COLUMN quotations.is_recurring; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quotations.is_recurring IS 'Flag to indicate if quotation is recurring';


--
-- Name: COLUMN quotations.recurring_interval; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quotations.recurring_interval IS 'Recurring interval: none, daily, weekly, monthly, yearly';


--
-- Name: COLUMN quotations.issue_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quotations.issue_date IS 'Date when quotation was issued to customer (format: YYYY-MM-DD)';


--
-- Name: quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotations_id_seq OWNED BY public.quotations.id;


--
-- Name: receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipts (
    id integer NOT NULL,
    receipt_number character varying,
    payment_id integer,
    customer_id integer,
    amount double precision,
    vat_amount double precision,
    withholding_tax_amount double precision,
    net_amount double precision,
    issued_date character varying,
    notes character varying
);


--
-- Name: receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipts_id_seq OWNED BY public.receipts.id;


--
-- Name: recurring_invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_invoice_items (
    id integer NOT NULL,
    recurring_invoice_id integer,
    product_id integer,
    quantity integer,
    unit_price double precision,
    discount_percent double precision,
    total_price double precision,
    description character varying
);


--
-- Name: recurring_invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recurring_invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recurring_invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recurring_invoice_items_id_seq OWNED BY public.recurring_invoice_items.id;


--
-- Name: recurring_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_invoices (
    id integer NOT NULL,
    customer_id integer,
    frequency character varying,
    start_date character varying,
    next_billing_date character varying,
    last_generated_date character varying,
    status character varying,
    total_amount double precision,
    vat_amount double precision,
    net_amount double precision,
    notes character varying,
    auto_send_email boolean,
    billing_day integer,
    due_day integer DEFAULT 17,
    wht_rate numeric(5,2) DEFAULT 3.00,
    last_billed_at timestamp without time zone
);


--
-- Name: recurring_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recurring_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recurring_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recurring_invoices_id_seq OWNED BY public.recurring_invoices.id;


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    due_date timestamp without time zone NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    type character varying(50) DEFAULT 'manual'::character varying,
    related_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer
);


--
-- Name: reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reminders_id_seq OWNED BY public.reminders.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    service_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    service_type character varying(50) DEFAULT 'service'::character varying,
    unit_price numeric(15,2) DEFAULT '0'::numeric,
    is_wht_applicable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: subscription_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_events (
    id integer NOT NULL,
    company_id integer NOT NULL,
    action character varying(50) NOT NULL,
    license_type character varying(50),
    license_key text,
    expires_at timestamp with time zone,
    max_users integer,
    amount numeric(12,2),
    notes text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subscription_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscription_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscription_events_id_seq OWNED BY public.subscription_events.id;


--
-- Name: subscription_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_invoices (
    id integer NOT NULL,
    subscription_id integer NOT NULL,
    invoice_id integer,
    billing_period date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subscription_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscription_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscription_invoices_id_seq OWNED BY public.subscription_invoices.id;


--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_groups (
    id integer NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL,
    assigned_by integer,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_groups_id_seq OWNED BY public.user_groups.id;


--
-- Name: users_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer DEFAULT nextval('public.users_id_seq1'::regclass) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255),
    role character varying(50) DEFAULT 'User'::character varying,
    status character varying(20) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer,
    group_id integer
);


--
-- Name: users_backup_1773898881424; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_backup_1773898881424 (
    id integer NOT NULL,
    username character varying,
    password_hash character varying,
    role character varying
);


--
-- Name: users_backup_1773898881424_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_backup_1773898881424_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_backup_1773898881424_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_backup_1773898881424_id_seq OWNED BY public.users_backup_1773898881424.id;


--
-- Name: wht_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wht_records (
    id integer NOT NULL,
    ref_id character varying,
    ref_type character varying,
    payer character varying,
    payee character varying,
    payee_tax_id character varying,
    income_type character varying,
    income_description character varying,
    gross_amount double precision,
    wht_rate double precision,
    wht_amount double precision,
    net_amount double precision,
    payment_date character varying,
    submitted boolean,
    submit_period character varying,
    form_type character varying,
    notes character varying
);


--
-- Name: wht_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wht_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wht_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wht_records_id_seq OWNED BY public.wht_records.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN id SET DEFAULT nextval('public.activity_log_id_seq'::regclass);


--
-- Name: ai_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_alerts ALTER COLUMN id SET DEFAULT nextval('public.ai_alerts_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: bank_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts ALTER COLUMN id SET DEFAULT nextval('public.bank_accounts_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: branch_stock id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock ALTER COLUMN id SET DEFAULT nextval('public.branch_stock_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: ck_games id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_games ALTER COLUMN id SET DEFAULT nextval('public.ck_games_id_seq'::regclass);


--
-- Name: ck_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_users ALTER COLUMN id SET DEFAULT nextval('public.ck_users_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: company id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company ALTER COLUMN id SET DEFAULT nextval('public.company_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: document_patterns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_patterns ALTER COLUMN id SET DEFAULT nextval('public.document_patterns_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: fb_kots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_kots ALTER COLUMN id SET DEFAULT nextval('public.fb_kots_id_seq'::regclass);


--
-- Name: fb_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_order_items ALTER COLUMN id SET DEFAULT nextval('public.fb_order_items_id_seq'::regclass);


--
-- Name: fb_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_orders ALTER COLUMN id SET DEFAULT nextval('public.fb_orders_id_seq'::regclass);


--
-- Name: fb_tables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_tables ALTER COLUMN id SET DEFAULT nextval('public.fb_tables_id_seq'::regclass);


--
-- Name: group_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_permissions ALTER COLUMN id SET DEFAULT nextval('public.group_permissions_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: integration_connections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_connections ALTER COLUMN id SET DEFAULT nextval('public.integration_connections_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: journal_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries ALTER COLUMN id SET DEFAULT nextval('public.journal_entries_id_seq'::regclass);


--
-- Name: loyalty_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_accounts ALTER COLUMN id SET DEFAULT nextval('public.loyalty_accounts_id_seq'::regclass);


--
-- Name: loyalty_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions ALTER COLUMN id SET DEFAULT nextval('public.loyalty_transactions_id_seq'::regclass);


--
-- Name: payment_vouchers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers ALTER COLUMN id SET DEFAULT nextval('public.payment_vouchers_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: payroll_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries ALTER COLUMN id SET DEFAULT nextval('public.payroll_entries_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- Name: quotation_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items ALTER COLUMN id SET DEFAULT nextval('public.quotation_items_id_seq'::regclass);


--
-- Name: quotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations ALTER COLUMN id SET DEFAULT nextval('public.quotations_id_seq'::regclass);


--
-- Name: receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts ALTER COLUMN id SET DEFAULT nextval('public.receipts_id_seq'::regclass);


--
-- Name: recurring_invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_invoice_items ALTER COLUMN id SET DEFAULT nextval('public.recurring_invoice_items_id_seq'::regclass);


--
-- Name: recurring_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_invoices ALTER COLUMN id SET DEFAULT nextval('public.recurring_invoices_id_seq'::regclass);


--
-- Name: reminders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders ALTER COLUMN id SET DEFAULT nextval('public.reminders_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: subscription_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events ALTER COLUMN id SET DEFAULT nextval('public.subscription_events_id_seq'::regclass);


--
-- Name: subscription_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices ALTER COLUMN id SET DEFAULT nextval('public.subscription_invoices_id_seq'::regclass);


--
-- Name: user_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups ALTER COLUMN id SET DEFAULT nextval('public.user_groups_id_seq'::regclass);


--
-- Name: users_backup_1773898881424 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_backup_1773898881424 ALTER COLUMN id SET DEFAULT nextval('public.users_backup_1773898881424_id_seq'::regclass);


--
-- Name: wht_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wht_records ALTER COLUMN id SET DEFAULT nextval('public.wht_records_id_seq'::regclass);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt", alg, crv) FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
f12d8c28-51b6-4890-9c5c-dfe07397d27d	mbsuite	ep-delicate-base-b31rx7ol	2026-09-23 11:23:53.344+00	2026-09-23 11:23:53.344+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, code, name, category, description, created_at) FROM stdin;
\.


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_log (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: ai_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_alerts (id, severity, category, title, detail, recommendation, reference_id, reference_label, status, dedup_key, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, asset_number, name, category, description, acquisition_date, acquisition_cost, current_value, depreciation_method, useful_life_years, accumulated_depreciation, location, status, notes) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "timestamp", "user", action, detail) FROM stdin;
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_accounts (id, bank_name, account_number, account_name, branch, is_default) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, product_id, user_id, qty, status, booked_at, expiry_at) FROM stdin;
\.


--
-- Data for Name: branch_stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branch_stock (id, company_id, branch_id, product_id, variant_id, stock_quantity, stock_qty, min_stock_level, updated_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, company_id, code, name, address, phone, manager_user_id, is_main, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, type) FROM stdin;
\.


--
-- Data for Name: chart_of_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chart_of_accounts (id, account_code, account_name_th, account_name_en, account_type, account_category, parent_id, is_active, is_contra, description, created_at) FROM stdin;
2121	2121	เจ้าหนี้การค้า	Output VAT	liability	\N	\N	t	f	\N	2026-09-23 11:56:37.943364+00
1113	1113	เงินฝากธนาคาร - กสิกรไทย	Bank Deposit - KBank	asset	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
1140	1140	ภาษีซื้อ	Input VAT	asset	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
1142	1142	ภาษีเงินได้ถูกหัก ณ ที่จ่าย	Withholding Tax Receivable	asset	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
1151	1151	ภาษีซื้อไม่ถึงกำหนด	Input VAT Undue	asset	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
2111	2111	เจ้าหนี้การค้า	Accounts Payable	liability	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
2122	2122	ภาษีขายไม่ถึงกำหนด	Output VAT Undue	liability	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
2130	2130	ภาษีหัก ณ ที่จ่ายค้างจ่าย	Withholding Tax Payable	liability	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
2140	2140	เงินเดือนค้างจ่าย	Wages Payable	liability	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
3110	3110	ทุนจดทะเบียนชำระแล้ว	Paid-up Capital	equity	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
3200	3200	กำไรสะสม	Retained Earnings	equity	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
4110	4110	รายได้จากการขายสินค้า/บริการ	Sales Revenue	revenue	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
4120	4120	ส่วนลดจ่าย	Sales Discounts	revenue	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
4210	4210	ดอกเบี้ยรับ	Interest Income	revenue	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5110	5110	ต้นทุนขาย	Cost of Goods Sold	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5210	5210	ค่าโฆษณา	Advertising Expense	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5220	5220	ค่าคอมมิชชัน	Sales Commission	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5310	5310	เงินเดือน	Salaries Expense	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5320	5320	ค่าเช่า	Rent Expense	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
1111	1111	เงินสด	Cash	asset	\N	\N	t	f	\N	2026-09-23 11:56:37.943364+00
1112	1112	เงินฝากธนาคาร	Bank Deposit - KTB	asset	\N	\N	t	f	\N	2026-09-23 11:56:37.943364+00
1121	1121	ลูกหนี้การค้า	Accounts Receivable	asset	\N	\N	t	f	\N	2026-09-23 11:56:37.943364+00
1131	1131	ภาษีซื้อ	Inventory	asset	\N	\N	t	f	\N	2026-09-23 11:56:37.943364+00
5330	5330	ค่าสาธารณูปโภค	Utilities Expense	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5340	5340	ค่าเสื่อมราคา	Depreciation Expense	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5410	5410	ดอกเบี้ยจ่าย	Interest Expense	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
5510	5510	ภาษีเงินได้นิติบุคคล	Corporate Income Tax	expense	\N	\N	t	f	\N	2026-10-11 20:10:29.299624+00
1132	1132	ภาษีซื้อรอใบกำกับ	Deferred Input VAT	asset	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
1141	1141	ภาษีเงินได้ถูกหัก ณ ที่จ่าย	Withholding Tax Receivable	asset	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
2131	2131	ภาษีขาย	Output VAT	liability	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
2141	2141	ภาษีหัก ณ ที่จ่ายรอนำส่ง	Withholding Tax Payable	liability	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
3111	3111	ทุนจดทะเบียน	Authorized Capital	equity	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
4111	4111	รายได้หลัก/ค่า License	Main Revenue / Licensing	revenue	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
5111	5111	ต้นทุนขาย/บริการ	Cost of Goods Sold	expense	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
5211	5211	ค่าใช้จ่ายดำเนินงาน	Operating Expenses	expense	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
6111	6111	กำไรสะสม	Retained Earnings	equity	\N	\N	t	f	\N	2026-10-23 06:49:51.567792+00
\.


--
-- Data for Name: ck_games; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ck_games (id, user_id, result, difficulty, moves, points, created_at) FROM stdin;
\.


--
-- Data for Name: ck_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ck_sessions (token, user_id, expires_at) FROM stdin;
\.


--
-- Data for Name: ck_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ck_users (id, username, password_hash, created_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, plan_type, max_users, subscription_status, expiry_date, created_at, updated_at, license_key, customer_name, customer_email, customer_phone, price_amount, price_currency, trial_end, last_renewed_at, notes, business_type) FROM stdin;
1	Your Company	PROFESSIONAL	5	Active	2027-12-31 23:59:59.999+00	2026-09-23 12:16:06.891005+00	2026-09-23 12:16:06.891005+00	\N	\N	\N	\N	0.00	THB	\N	\N	\N	general
2	innovation	TRIAL	1	Active	\N	2026-09-24 10:11:22.239743+00	2026-09-24 10:11:22.239743+00	\N	\N	\N	\N	0.00	THB	2026-10-08 10:11:22.239743+00	\N	\N	general
3	บริษัท ทดสอบ จำกัด	TRIAL	1	Active	\N	2026-11-05 14:46:46.953066+00	2026-11-05 14:46:46.953066+00	\N	\N	\N	\N	0.00	THB	2026-11-19 14:46:46.953066+00	\N	\N	general
\.


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company (id, name, tax_id, address, phone, email, logo_base64, vat_rate, withholding_tax_rate, corporate_tax_rate, tax_exemption_years, tax_reduction_years, tax_exemption_start_year, currency, inv_prefix, rec_prefix, pay_prefix, exp_prefix, quo_prefix, smtp_server, smtp_port, smtp_user, smtp_pass, smtp_use_tls, email_sender, is_setup, google_service_account_json, google_authorized_email, last_google_sync) FROM stdin;
\.


--
-- Data for Name: company_module_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_module_settings (company_id, module_id, is_enabled, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, name, address, tax_id, phone, email, logo_url, website, updated_at, bank_name, bank_account_name, bank_account_number, bank_branch, vat_rate, withholding_tax_rate, is_vat_registered, currency, invoice_prefix, quotation_prefix, google_client_id, google_client_secret, google_refresh_token, google_redirect_uri, google_drive_enabled, created_at, company_id, receipt_prefix, journal_prefix, invoice_footer, quotation_footer, receipt_footer, rd_client_id, rd_client_secret, rd_api_key, rd_base_url, rd_enabled) FROM stdin;
1	Micro-Business-Suite	Company Address, Thailand		\N	\N	\N	\N	2026-10-23 07:58:39.960305+00	\N	\N	\N	\N	7.00	3.00	t	THB	INV	QT	\N	\N	\N	https://developers.google.com/oauthplayground	f	2026-10-23 07:58:39.960305+00	\N	REC	GJ	\N	\N	\N	\N	\N	\N	https://api-portal.rd.go.th	f
2	Your Company	\N	\N	\N	\N	\N	\N	2026-11-05 16:09:54.014119+00	\N	\N	\N	\N	7.00	3.00	t	THB	INV	QT	\N	\N	\N	https://developers.google.com/oauthplayground	f	2026-11-05 16:09:54.014119+00	1	REC	GJ	\N	\N	\N	\N	\N	\N	https://api-portal.rd.go.th	f
3	innovation	\N	\N	\N	\N	\N	\N	2026-11-05 16:09:54.014119+00	\N	\N	\N	\N	7.00	3.00	t	THB	INV	QT	\N	\N	\N	https://developers.google.com/oauthplayground	f	2026-11-05 16:09:54.014119+00	2	REC	GJ	\N	\N	\N	\N	\N	\N	https://api-portal.rd.go.th	f
4	บริษัท ทดสอบ จำกัด	\N	\N	\N	\N	\N	\N	2026-11-05 16:09:54.014119+00	\N	\N	\N	\N	7.00	3.00	t	THB	INV	QT	\N	\N	\N	https://developers.google.com/oauthplayground	f	2026-11-05 16:09:54.014119+00	3	REC	GJ	\N	\N	\N	\N	\N	\N	https://api-portal.rd.go.th	f
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (id, name, type, tax_id, address, phone, email, contact_person, is_active, contact_type, company_id) FROM stdin;
\.


--
-- Data for Name: document_patterns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_patterns (id, document_type, prefix, include_year, include_month, separator, digits, last_number, current_pattern, updated_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, expense_number, category, description, amount, vat_amount, withholding_tax_amount, net_amount, expense_date, vendor, wht_type, payment_method, receipt_base64, tax_deductible, notes, status, updated_at, tax_invoice_no, tax_invoice_date, contact_id, classification, receipt_url, receipt_file_name, receipt_mime_type, pp36_exempt, company_id, reference_no, wht_rate, wht_amount, is_service, original_currency, original_amount, exchange_rate) FROM stdin;
\.


--
-- Data for Name: fb_kots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fb_kots (id, company_id, order_id, kot_number, status, items_json, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fb_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fb_order_items (id, order_id, product_id, description, qty, price, total, notes, kot_sent, created_at) FROM stdin;
\.


--
-- Data for Name: fb_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fb_orders (id, company_id, table_id, order_number, status, subtotal, discount, vat, total, notes, invoice_id, created_by, created_at, updated_at, closed_at) FROM stdin;
\.


--
-- Data for Name: fb_tables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fb_tables (id, company_id, code, name, seats, zone, status, current_order_id, pos_x, pos_y, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: group_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_permissions (id, group_id, module, can_create, can_read, can_update, can_delete, can_export, can_manage, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, name, permissions, created_at, is_system, color, created_by, updated_at) FROM stdin;
\.


--
-- Data for Name: integration_connections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_connections (id, company_id, provider, category, name, credentials, settings, status, last_sync_at, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, product_id, quantity, unit_price, discount_percent, total_price, description) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, customer_id, user_id, total_amount, vat_amount, discount_amount, net_amount, status, created_at, due_date, notes, contact_id, rd_submission_id, rd_status, rd_submitted_at, rd_error_message, issue_date, quotation_id, company_id, updated_at, is_service) FROM stdin;
\.


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_entries (id, entry_date, reference_no, account_name, description, debit, credit, created_at, receipt_url, journal_type, reference_type, reference_id, debit_account_id, credit_account_id, amount, vat_rate, vat_amount, withholding_rate, withholding_amount, fiscal_year, fiscal_month, document_number, notes, company_id) FROM stdin;
\.


--
-- Data for Name: loyalty_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loyalty_accounts (id, company_id, contact_id, tier, points_balance, lifetime_points, total_spent, member_since, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: loyalty_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loyalty_transactions (id, company_id, account_id, tx_type, points, balance_after, reference_type, reference_id, description, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: payment_vouchers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_vouchers (id, voucher_no, issue_date, payee_name, amount, payment_method, description, status, created_at, receipt_url, rd_submission_id, rd_status, rd_submitted_at, rd_error_message, expense_id, vendor_id, company_id, vat_amount, tax_id, wht_amount) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, invoice_id, amount, payment_date, payment_method, reference_number, notes, company_id, updated_at, payment_no, status, wht_amount, vat_amount, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_entries (id, company_id, employee_code, employee_name, payroll_month, gross_amount, tax_withheld, net_amount, currency, source_system, external_ref, notes, metadata, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_categories (id, name, description, created_at, company_id) FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_variants (id, company_id, product_id, branch_id, sku_variant, barcode, variant_name, color, size, attr_type, price_override, cost_price_override, stock_quantity, stock_qty, min_stock_level, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, sku, name, description, price, stock_qty, unit, category_id, type, sku_number, source_info, storage_location, product_notes, stock_quantity, category_name, cost_price, company_id) FROM stdin;
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotions (id, company_id, code, name, description, promo_type, value, min_purchase, max_discount, applies_to, applies_ids, starts_at, ends_at, usage_limit, usage_count, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotation_items (id, quotation_id, product_id, quantity, unit_price, discount_percent, total_price, description) FROM stdin;
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotations (id, quotation_number, customer_id, user_id, total_amount, vat_amount, discount_amount, net_amount, status, created_at, expiry_date, notes, contact_id, is_recurring, recurring_interval, company_id, issue_date) FROM stdin;
\.


--
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.receipts (id, receipt_number, payment_id, customer_id, amount, vat_amount, withholding_tax_amount, net_amount, issued_date, notes) FROM stdin;
\.


--
-- Data for Name: recurring_invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recurring_invoice_items (id, recurring_invoice_id, product_id, quantity, unit_price, discount_percent, total_price, description) FROM stdin;
\.


--
-- Data for Name: recurring_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recurring_invoices (id, customer_id, frequency, start_date, next_billing_date, last_generated_date, status, total_amount, vat_amount, net_amount, notes, auto_send_email, billing_day, due_day, wht_rate, last_billed_at) FROM stdin;
\.


--
-- Data for Name: reminders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reminders (id, title, description, due_date, status, type, related_id, created_at, company_id) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, service_code, name, description, service_type, unit_price, is_wht_applicable, is_active, created_at, updated_at, company_id) FROM stdin;
1	SRV-AGENT	Agent Management Fee	ค่าบริการประสานงานรายปี การจัดการใบอนุญาตและการสนับสนุนเบื้องต้น	agent_fee	10000.00	t	t	2026-09-23 11:56:38.861231+00	2026-09-23 11:56:38.861231+00	1
2	SRV-SETUP	Setup & Provisioning Fee	ค่าบริการเปิดระบบและตั้งค่าเริ่มต้น	professional	5000.00	t	t	2026-09-23 11:56:38.861231+00	2026-09-23 11:56:38.861231+00	1
3	SRV-TECHD	Technical Support (Man-Day)	ค่าบริการที่ปรึกษาและซัพพอร์ตเชิงเทคนิคแบบรายวัน	professional	3500.00	t	t	2026-09-23 11:56:38.861231+00	2026-09-23 11:56:38.861231+00	1
4	SRV-TECHH	Technical Support (Man-Hour)	ค่าบริการที่ปรึกษาและซัพพอร์ตเชิงเทคนิคแบบรายชั่วโมง	professional	500.00	t	t	2026-09-23 11:56:38.861231+00	2026-09-23 11:56:38.861231+00	1
\.


--
-- Data for Name: subscription_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_events (id, company_id, action, license_type, license_key, expires_at, max_users, amount, notes, payload, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: subscription_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_invoices (id, subscription_id, invoice_id, billing_period, created_at) FROM stdin;
\.


--
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_groups (id, user_id, group_id, assigned_by, assigned_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, role, status, created_at, company_id, group_id) FROM stdin;
2	grids.bitcoin@gmail.com	$2b$10$gdxRVg1pF8X.OtCtxmeAOOgCHaDPwiwz.ZOZg25JkTruSeiPpXu7a	Neon13	user	Active	2026-09-24 10:11:22.239743+00	2	\N
1	admin@mbsuite.app	$2b$10$Gsbis98cFJfB5TP3ydH3/eyblInJVME.sxYo8sqFqVI.b/J.kq/86	Admin	superadmin	Active	2026-09-23 12:16:06.950256+00	1	\N
3	2024.1xxx@gmail.com	$2b$10$4wcjirD/c4BgK9lwu.RHTuXXj7jxDPNpKiMkdCFJJC1W353F3wyXu	หนูดี ทดสอบ	user	Active	2026-11-05 14:46:46.953066+00	3	\N
\.


--
-- Data for Name: users_backup_1773898881424; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users_backup_1773898881424 (id, username, password_hash, role) FROM stdin;
\.


--
-- Data for Name: wht_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wht_records (id, ref_id, ref_type, payer, payee, payee_tax_id, income_type, income_description, gross_amount, wht_rate, wht_amount, net_amount, payment_date, submitted, submit_period, form_type, notes) FROM stdin;
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 1, false);


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 1, false);


--
-- Name: ai_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_alerts_id_seq', 1, false);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bank_accounts_id_seq', 1, false);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookings_id_seq', 1, false);


--
-- Name: branch_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branch_stock_id_seq', 1, false);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branches_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- Name: ck_games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ck_games_id_seq', 1, false);


--
-- Name: ck_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ck_users_id_seq', 1, false);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.companies_id_seq', 3, true);


--
-- Name: company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_id_seq', 1, false);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 4, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contacts_id_seq', 1, false);


--
-- Name: document_patterns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_patterns_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: fb_kots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fb_kots_id_seq', 1, false);


--
-- Name: fb_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fb_order_items_id_seq', 1, false);


--
-- Name: fb_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fb_orders_id_seq', 1, false);


--
-- Name: fb_tables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fb_tables_id_seq', 1, false);


--
-- Name: group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_permissions_id_seq', 1, false);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- Name: integration_connections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.integration_connections_id_seq', 1, false);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: journal_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.journal_entries_id_seq', 1, false);


--
-- Name: loyalty_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loyalty_accounts_id_seq', 1, false);


--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loyalty_transactions_id_seq', 1, false);


--
-- Name: payment_vouchers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_vouchers_id_seq', 1, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, true);


--
-- Name: payroll_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_entries_id_seq', 1, false);


--
-- Name: product_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_categories_id_seq', 1, false);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 1, false);


--
-- Name: promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.promotions_id_seq', 1, false);


--
-- Name: quotation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotation_items_id_seq', 1, false);


--
-- Name: quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotations_id_seq', 1, false);


--
-- Name: receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.receipts_id_seq', 1, false);


--
-- Name: recurring_invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recurring_invoice_items_id_seq', 1, false);


--
-- Name: recurring_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recurring_invoices_id_seq', 1, false);


--
-- Name: reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reminders_id_seq', 1, false);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 8, true);


--
-- Name: subscription_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_events_id_seq', 1, false);


--
-- Name: subscription_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_invoices_id_seq', 1, false);


--
-- Name: user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_groups_id_seq', 1, false);


--
-- Name: users_backup_1773898881424_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_backup_1773898881424_id_seq', 1, false);


--
-- Name: users_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq1', 3, true);


--
-- Name: wht_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wht_records_id_seq', 1, false);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_code_key UNIQUE (code);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: ai_alerts ai_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_alerts
    ADD CONSTRAINT ai_alerts_pkey PRIMARY KEY (id);


--
-- Name: assets assets_asset_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_asset_number_key UNIQUE (asset_number);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: branch_stock branch_stock_branch_id_product_id_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_branch_id_product_id_variant_id_key UNIQUE (branch_id, product_id, variant_id);


--
-- Name: branch_stock branch_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_pkey PRIMARY KEY (id);


--
-- Name: branches branches_company_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_company_id_code_key UNIQUE (company_id, code);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: chart_of_accounts chart_of_accounts_account_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_account_code_key UNIQUE (account_code);


--
-- Name: chart_of_accounts chart_of_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id);


--
-- Name: ck_games ck_games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_games
    ADD CONSTRAINT ck_games_pkey PRIMARY KEY (id);


--
-- Name: ck_sessions ck_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_sessions
    ADD CONSTRAINT ck_sessions_pkey PRIMARY KEY (token);


--
-- Name: ck_users ck_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_users
    ADD CONSTRAINT ck_users_pkey PRIMARY KEY (id);


--
-- Name: ck_users ck_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_users
    ADD CONSTRAINT ck_users_username_key UNIQUE (username);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_module_settings company_module_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_module_settings
    ADD CONSTRAINT company_module_settings_pkey PRIMARY KEY (company_id, module_id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: document_patterns document_patterns_document_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_patterns
    ADD CONSTRAINT document_patterns_document_type_key UNIQUE (document_type);


--
-- Name: document_patterns document_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_patterns
    ADD CONSTRAINT document_patterns_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_expense_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_expense_number_key UNIQUE (expense_number);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: fb_kots fb_kots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_kots
    ADD CONSTRAINT fb_kots_pkey PRIMARY KEY (id);


--
-- Name: fb_order_items fb_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_order_items
    ADD CONSTRAINT fb_order_items_pkey PRIMARY KEY (id);


--
-- Name: fb_orders fb_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_orders
    ADD CONSTRAINT fb_orders_pkey PRIMARY KEY (id);


--
-- Name: fb_tables fb_tables_company_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_tables
    ADD CONSTRAINT fb_tables_company_id_code_key UNIQUE (company_id, code);


--
-- Name: fb_tables fb_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_tables
    ADD CONSTRAINT fb_tables_pkey PRIMARY KEY (id);


--
-- Name: group_permissions group_permissions_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_permissions
    ADD CONSTRAINT group_permissions_group_id_key UNIQUE (group_id);


--
-- Name: group_permissions group_permissions_group_id_module_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_permissions
    ADD CONSTRAINT group_permissions_group_id_module_key UNIQUE (group_id, module);


--
-- Name: group_permissions group_permissions_module_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_permissions
    ADD CONSTRAINT group_permissions_module_key UNIQUE (module);


--
-- Name: group_permissions group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_permissions
    ADD CONSTRAINT group_permissions_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: integration_connections integration_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_connections
    ADD CONSTRAINT integration_connections_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: loyalty_accounts loyalty_accounts_company_id_contact_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_company_id_contact_id_key UNIQUE (company_id, contact_id);


--
-- Name: loyalty_accounts loyalty_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_vouchers payment_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_pkey PRIMARY KEY (id);


--
-- Name: payments payments_payment_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_no_key UNIQUE (payment_no);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payroll_entries payroll_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_name_key UNIQUE (name);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: products products_sku_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_number_key UNIQUE (sku_number);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: quotation_items quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_quotation_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_quotation_number_key UNIQUE (quotation_number);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_receipt_number_key UNIQUE (receipt_number);


--
-- Name: recurring_invoice_items recurring_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_invoice_items
    ADD CONSTRAINT recurring_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: recurring_invoices recurring_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_invoices
    ADD CONSTRAINT recurring_invoices_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: services services_service_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_service_code_key UNIQUE (service_code);


--
-- Name: subscription_events subscription_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_pkey PRIMARY KEY (id);


--
-- Name: subscription_invoices subscription_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_pkey PRIMARY KEY (id);


--
-- Name: user_groups user_groups_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_group_id_key UNIQUE (group_id);


--
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (id);


--
-- Name: user_groups user_groups_user_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_user_id_group_id_key UNIQUE (user_id, group_id);


--
-- Name: user_groups user_groups_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users_backup_1773898881424 users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_backup_1773898881424
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey1 PRIMARY KEY (id);


--
-- Name: users_backup_1773898881424 users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_backup_1773898881424
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: wht_records wht_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wht_records
    ADD CONSTRAINT wht_records_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: ck_games_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ck_games_created_idx ON public.ck_games USING btree (created_at DESC);


--
-- Name: ck_games_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ck_games_user_idx ON public.ck_games USING btree (user_id);


--
-- Name: ck_sessions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ck_sessions_user_idx ON public.ck_sessions USING btree (user_id);


--
-- Name: company_settings_company_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX company_settings_company_id_key ON public.company_settings USING btree (company_id) WHERE (company_id IS NOT NULL);


--
-- Name: idx_ai_alerts_dedup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_alerts_dedup ON public.ai_alerts USING btree (dedup_key);


--
-- Name: idx_ai_alerts_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_alerts_severity ON public.ai_alerts USING btree (severity);


--
-- Name: idx_ai_alerts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_alerts_status ON public.ai_alerts USING btree (status);


--
-- Name: idx_branch_stock_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branch_stock_branch ON public.branch_stock USING btree (branch_id);


--
-- Name: idx_branch_stock_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branch_stock_company ON public.branch_stock USING btree (company_id);


--
-- Name: idx_branch_stock_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branch_stock_product ON public.branch_stock USING btree (product_id);


--
-- Name: idx_branches_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_active ON public.branches USING btree (company_id, is_active);


--
-- Name: idx_branches_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_company ON public.branches USING btree (company_id);


--
-- Name: idx_companies_business_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_business_type ON public.companies USING btree (business_type);


--
-- Name: idx_companies_license_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_companies_license_key ON public.companies USING btree (license_key) WHERE (license_key IS NOT NULL);


--
-- Name: idx_contacts_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_company ON public.contacts USING btree (company_id);


--
-- Name: idx_expenses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_category ON public.expenses USING btree (category);


--
-- Name: idx_expenses_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_company ON public.expenses USING btree (company_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);


--
-- Name: idx_expenses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_status ON public.expenses USING btree (status);


--
-- Name: idx_fb_kots_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fb_kots_order ON public.fb_kots USING btree (order_id);


--
-- Name: idx_fb_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fb_order_items_order ON public.fb_order_items USING btree (order_id);


--
-- Name: idx_fb_orders_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fb_orders_company ON public.fb_orders USING btree (company_id);


--
-- Name: idx_fb_orders_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fb_orders_table ON public.fb_orders USING btree (table_id);


--
-- Name: idx_fb_tables_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fb_tables_company ON public.fb_tables USING btree (company_id);


--
-- Name: idx_groups_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_name ON public.groups USING btree (name);


--
-- Name: idx_intconn_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intconn_company ON public.integration_connections USING btree (company_id);


--
-- Name: idx_intconn_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intconn_provider ON public.integration_connections USING btree (provider);


--
-- Name: idx_invoices_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_company ON public.invoices USING btree (company_id);


--
-- Name: idx_invoices_rd_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_rd_submission ON public.invoices USING btree (rd_submission_id);


--
-- Name: idx_journal_entries_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_company ON public.journal_entries USING btree (company_id);


--
-- Name: idx_journal_entries_credit_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_credit_account_id ON public.journal_entries USING btree (credit_account_id);


--
-- Name: idx_journal_entries_debit_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_debit_account_id ON public.journal_entries USING btree (debit_account_id);


--
-- Name: idx_journal_entries_document_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_document_number ON public.journal_entries USING btree (document_number);


--
-- Name: idx_journal_entries_fiscal_year_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_fiscal_year_month ON public.journal_entries USING btree (fiscal_year, fiscal_month);


--
-- Name: idx_journal_entries_reference_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_reference_type_id ON public.journal_entries USING btree (reference_type, reference_id);


--
-- Name: idx_journal_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_ref ON public.journal_entries USING btree (reference_type, reference_id);


--
-- Name: idx_journal_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_reference ON public.journal_entries USING btree (reference_type, reference_id);


--
-- Name: idx_loyalty_accounts_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_accounts_company ON public.loyalty_accounts USING btree (company_id);


--
-- Name: idx_loyalty_accounts_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_accounts_contact ON public.loyalty_accounts USING btree (contact_id);


--
-- Name: idx_loyalty_tx_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_tx_account ON public.loyalty_transactions USING btree (account_id);


--
-- Name: idx_loyalty_tx_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_tx_company ON public.loyalty_transactions USING btree (company_id);


--
-- Name: idx_loyalty_tx_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_tx_ref ON public.loyalty_transactions USING btree (reference_type, reference_id);


--
-- Name: idx_payment_vouchers_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_vouchers_company ON public.payment_vouchers USING btree (company_id);


--
-- Name: idx_payments_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_company ON public.payments USING btree (company_id);


--
-- Name: idx_payments_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_invoice ON public.payments USING btree (invoice_id);


--
-- Name: idx_payments_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_invoice_id ON public.payments USING btree (invoice_id);


--
-- Name: idx_payroll_entries_company_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_entries_company_month ON public.payroll_entries USING btree (company_id, payroll_month DESC);


--
-- Name: idx_product_categories_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_categories_company ON public.product_categories USING btree (company_id);


--
-- Name: idx_product_variants_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_barcode ON public.product_variants USING btree (company_id, barcode);


--
-- Name: idx_product_variants_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_branch ON public.product_variants USING btree (branch_id);


--
-- Name: idx_product_variants_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_company ON public.product_variants USING btree (company_id);


--
-- Name: idx_product_variants_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);


--
-- Name: idx_products_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_company ON public.products USING btree (company_id);


--
-- Name: idx_products_cost_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_cost_price ON public.products USING btree (cost_price);


--
-- Name: idx_promotions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_active ON public.promotions USING btree (company_id, is_active);


--
-- Name: idx_promotions_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_company ON public.promotions USING btree (company_id);


--
-- Name: idx_promotions_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_dates ON public.promotions USING btree (starts_at, ends_at);


--
-- Name: idx_quotations_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotations_company ON public.quotations USING btree (company_id);


--
-- Name: idx_reminders_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_company ON public.reminders USING btree (company_id);


--
-- Name: idx_services_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_company ON public.services USING btree (company_id);


--
-- Name: idx_subscription_events_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_events_company ON public.subscription_events USING btree (company_id, created_at DESC);


--
-- Name: idx_vouchers_expense; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_expense ON public.payment_vouchers USING btree (expense_id);


--
-- Name: idx_vouchers_expense_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_expense_id ON public.payment_vouchers USING btree (expense_id);


--
-- Name: idx_vouchers_rd_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_rd_submission ON public.payment_vouchers USING btree (rd_submission_id);


--
-- Name: idx_vouchers_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_vendor_id ON public.payment_vouchers USING btree (vendor_id);


--
-- Name: ux_product_variants_sku_company; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_product_variants_sku_company ON public.product_variants USING btree (company_id, sku_variant) WHERE (sku_variant IS NOT NULL);


--
-- Name: ux_promotions_code_company; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_promotions_code_company ON public.promotions USING btree (company_id, code) WHERE (code IS NOT NULL);


--
-- Name: ux_subscription_billing_period; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_subscription_billing_period ON public.subscription_invoices USING btree (subscription_id, billing_period);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: activity_log activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_backup_1773898881424(id);


--
-- Name: branch_stock branch_stock_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: branch_stock branch_stock_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: branch_stock branch_stock_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: branch_stock branch_stock_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_stock
    ADD CONSTRAINT branch_stock_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: branches branches_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: branches branches_manager_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_manager_user_id_fkey FOREIGN KEY (manager_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chart_of_accounts chart_of_accounts_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: ck_games ck_games_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_games
    ADD CONSTRAINT ck_games_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.ck_users(id) ON DELETE CASCADE;


--
-- Name: ck_sessions ck_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ck_sessions
    ADD CONSTRAINT ck_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.ck_users(id) ON DELETE CASCADE;


--
-- Name: company_module_settings company_module_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_module_settings
    ADD CONSTRAINT company_module_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_module_settings company_module_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_module_settings
    ADD CONSTRAINT company_module_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: company_settings company_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: fb_kots fb_kots_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_kots
    ADD CONSTRAINT fb_kots_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: fb_kots fb_kots_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_kots
    ADD CONSTRAINT fb_kots_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.fb_orders(id) ON DELETE CASCADE;


--
-- Name: fb_order_items fb_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_order_items
    ADD CONSTRAINT fb_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.fb_orders(id) ON DELETE CASCADE;


--
-- Name: fb_order_items fb_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_order_items
    ADD CONSTRAINT fb_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: fb_orders fb_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_orders
    ADD CONSTRAINT fb_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: fb_orders fb_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_orders
    ADD CONSTRAINT fb_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fb_orders fb_orders_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_orders
    ADD CONSTRAINT fb_orders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: fb_orders fb_orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_orders
    ADD CONSTRAINT fb_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.fb_tables(id) ON DELETE SET NULL;


--
-- Name: fb_tables fb_tables_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fb_tables
    ADD CONSTRAINT fb_tables_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: users fk_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;


--
-- Name: group_permissions group_permissions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_permissions
    ADD CONSTRAINT group_permissions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: integration_connections integration_connections_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_connections
    ADD CONSTRAINT integration_connections_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: invoice_items invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: invoices invoices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.contacts(id);


--
-- Name: invoices invoices_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: journal_entries journal_entries_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: journal_entries journal_entries_credit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_credit_account_id_fkey FOREIGN KEY (credit_account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: journal_entries journal_entries_debit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_debit_account_id_fkey FOREIGN KEY (debit_account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: loyalty_accounts loyalty_accounts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: loyalty_accounts loyalty_accounts_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: loyalty_transactions loyalty_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE;


--
-- Name: loyalty_transactions loyalty_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: loyalty_transactions loyalty_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: payment_vouchers payment_vouchers_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id);


--
-- Name: payment_vouchers payment_vouchers_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.contacts(id);


--
-- Name: payments payments_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: payroll_entries payroll_entries_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: payroll_entries payroll_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: product_categories product_categories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: product_variants product_variants_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: product_variants product_variants_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: products products_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: promotions promotions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: promotions promotions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quotation_items quotation_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: quotation_items quotation_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id);


--
-- Name: quotations quotations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: quotations quotations_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: quotations quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.contacts(id);


--
-- Name: quotations quotations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: receipts receipts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.contacts(id);


--
-- Name: receipts receipts_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: recurring_invoice_items recurring_invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_invoice_items
    ADD CONSTRAINT recurring_invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: recurring_invoice_items recurring_invoice_items_recurring_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_invoice_items
    ADD CONSTRAINT recurring_invoice_items_recurring_invoice_id_fkey FOREIGN KEY (recurring_invoice_id) REFERENCES public.recurring_invoices(id);


--
-- Name: recurring_invoices recurring_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_invoices
    ADD CONSTRAINT recurring_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.contacts(id);


--
-- Name: reminders reminders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: services services_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: subscription_events subscription_events_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: subscription_events subscription_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscription_invoices subscription_invoices_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: subscription_invoices subscription_invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_invoices
    ADD CONSTRAINT subscription_invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.recurring_invoices(id) ON DELETE CASCADE;


--
-- Name: user_groups user_groups_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_groups user_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: user_groups user_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict DtJ1HUiVeWqDYy7YbOwLsKMl776ww1eCVBzFihJkxtFm2tf0URDn1e69eXpUgrW

