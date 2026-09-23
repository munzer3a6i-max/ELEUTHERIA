-- Everything this browser held, as SQL.
-- Written from /tmp/eleutheria-1SAkhr/export.json on 2026-09-23.
--
-- Paste into the Supabase SQL editor and run it once. Running it twice
-- updates the same rows rather than making a second copy of everything.
--
-- Commissions, agency charges and backouts are barely in here: the
-- triggers work those out from the stage log as it arrives, and what
-- follows only says which of them had been settled.

begin;
insert into ops.settings (id, company_name, company_tagline, license_number, address, currency)
     values (true, 'Eleutheria', 'International Placement Services', 'DMW-622-LB-07032025-R', 'Gedisco Center, Ermita, Manila', 'USD')
     on conflict (id) do update set company_name = excluded.company_name, company_tagline = excluded.company_tagline,
       license_number = excluded.license_number, address = excluded.address, currency = excluded.currency;

insert into ops.countries (id, name_en, name_ar)
values
  ('a0a4bb41-46ff-51d2-94f0-acbb5c9fd5c6', 'Philippines', 'الفلبين'),
  ('d11c4e6e-8383-5dab-b798-a6b9cbb2d945', 'Saudi Arabia', 'المملكة العربية السعودية'),
  ('fede2bbf-8b56-5ad4-8ee3-5e67a2527368', 'Indonesia', 'إندونيسيا'),
  ('9bd925e4-890a-5aa3-a50d-86ee699b1c6e', 'India', 'الهند')
on conflict (id) do update set name_en = excluded.name_en, name_ar = excluded.name_ar;

insert into ops.cities (id, country_id, name_en, name_ar)
values
  ('639a3d15-3b62-5ff4-9aac-17cb4962df3a', 'a0a4bb41-46ff-51d2-94f0-acbb5c9fd5c6', 'Manila', 'مانيلا'),
  ('e1f90435-629c-5385-9b0d-a77f3c1b1a21', 'a0a4bb41-46ff-51d2-94f0-acbb5c9fd5c6', 'Cebu', 'سيبو'),
  ('537d8575-414d-5b36-bd28-35138a193db2', 'd11c4e6e-8383-5dab-b798-a6b9cbb2d945', 'Riyadh', 'الرياض'),
  ('d047c0df-e44b-58e4-84cd-cc28bcfa7878', 'd11c4e6e-8383-5dab-b798-a6b9cbb2d945', 'Jeddah', 'جدة'),
  ('516a06c0-04d1-5ba4-a1e2-b5f1d75c38df', 'd11c4e6e-8383-5dab-b798-a6b9cbb2d945', 'Dammam', 'الدمام')
on conflict (id) do update set country_id = excluded.country_id, name_en = excluded.name_en, name_ar = excluded.name_ar;

insert into ops.professions (id, name_en, name_ar)
values
  ('fb051069-f307-5c19-944d-0b423a59db75', 'Housemaid', 'عاملة منزلية'),
  ('757b7659-daba-5480-9915-9cb0fec44522', 'Driver', 'سائق'),
  ('e1d90496-c16a-52de-a336-82b0a4d52415', 'Caregiver', 'مقدمة رعاية'),
  ('1c436cb4-3a0e-50f2-b31c-f814d17825af', 'Cook', 'طباخ'),
  ('1134df09-ce1a-5439-b410-47fcc8733544', 'Mechanic', 'ميكانيكي'),
  ('134d9d83-ce92-5bf6-81c3-f1ef99e8f281', 'Hairdresser', 'مصففة شعر'),
  ('ff4e4ca8-5246-5596-8a18-b7a8abf966c7', 'Barista', 'باريستا')
on conflict (id) do update set name_en = excluded.name_en, name_ar = excluded.name_ar;

insert into ops.payment_sources (id, name, scopes)
values
  ('fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'Cash - Agency', '{"Invoices","Request Status"}'),
  ('0642ebee-02d7-56db-b2b6-76849d87ee5c', 'Bank Transfer', '{"Invoices","Request Status"}'),
  ('567d584f-fdd9-59a7-be3d-5de2469cea22', 'Cash - Farid', '{"Invoices","Request Status"}'),
  ('2af93d69-92a3-572c-89a1-323506eb693f', 'Credit Card', '{"Invoices"}'),
  ('3feb08a5-1a33-582b-aa6f-377092259f6d', 'Cheque', '{"Invoices"}')
on conflict (id) do update set name = excluded.name, scopes = excluded.scopes;

insert into ops.staff (id, username, name_en, name_ar, phone, email, role, status)
values
  ('dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', 'kylie', 'Kylie', 'كايلي', '+966 55 100 0001', 'kylie@mustaqdem.com', 'admin', 'Active'),
  ('ac542bfa-b00f-5d81-a8df-e06b8e5ef673', 'tess', 'Tess', 'تيس', '+966 55 100 0002', 'tess@mustaqdem.com', 'accountant', 'Active'),
  ('1c258b2d-8249-5639-85ae-82e7f494246d', 'roz', 'Roz', 'روز', '+966 55 100 0003', 'roz@mustaqdem.com', 'data_entry', 'Active'),
  ('efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', 'eman', 'Eman', 'إيمان', '+966 55 100 0004', 'eman@mustaqdem.com', 'data_entry', 'Active')
on conflict (id) do update set username = excluded.username, name_en = excluded.name_en, name_ar = excluded.name_ar, phone = excluded.phone, email = excluded.email, role = excluded.role, status = excluded.status;

insert into ops.agencies (id, english_name, arabic_name, license_number, license_expiry, phone, email, telephone, rating, primary_manager_en, primary_manager_ar, second_manager_en, second_manager_ar, status)
values
  ('a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', 'Six Direction Resources Company', 'شركة الاتجاهات الست للموارد', 'POEA-2019-00451', '2027-03-01', '+63 2 8123 4501', 'contact@sixdirection.ph', '+63 2 8123 4502', 4, 'Marco Villanueva', 'ماركو فيلانويفا', 'Liza Ramos', 'ليزا راموس', 'Active'),
  ('9b523278-8af4-5935-8584-3d9939348c43', 'Pacific Crew Manpower Services', 'باسيفيك كرو للقوى العاملة', 'POEA-2020-00812', '2026-09-15', '+63 2 8123 7788', 'ops@pacificcrew.ph', '+63 2 8123 7789', 5, 'Ramon Cruz', 'رامون كروز', 'Ana Bautista', 'آنا باوتيستا', 'Active'),
  ('3769e31f-242d-5414-b83d-731252c0bfe6', 'Golden Gate Overseas Recruitment', 'البوابة الذهبية للاستقدام', 'POEA-2018-00203', '2025-12-31', '+63 32 234 5566', 'info@goldengateoverseas.ph', '+63 32 234 5567', 3, 'Josefina Dela Peña', 'خوسيفينا ديلا بينيا', 'Noel Garcia', 'نويل غارسيا', 'Active')
on conflict (id) do update set english_name = excluded.english_name, arabic_name = excluded.arabic_name, license_number = excluded.license_number, license_expiry = excluded.license_expiry, phone = excluded.phone, email = excluded.email, telephone = excluded.telephone, rating = excluded.rating, primary_manager_en = excluded.primary_manager_en, primary_manager_ar = excluded.primary_manager_ar, second_manager_en = excluded.second_manager_en, second_manager_ar = excluded.second_manager_ar, status = excluded.status;

insert into ops.agents (id, name_en, name_ar, phone, email, area, status, selection_fee, deployment_fee, notes)
values
  ('0b60732c-b39d-5745-a7fa-36cc75666b11', 'Nelson Bautista', 'نيلسون باوتيستا', '+63 918 220 4471', 'nelson.bautista@outlook.ph', 'Cavite and Laguna', 'Active', 500, 500, 'Sources mostly experienced household staff returning from the Gulf.'),
  ('ab874111-47ec-5fde-ba1a-5810c12f125d', 'Grace Villamor', 'غرايس فيلامور', '+63 917 883 5520', 'g.villamor@gmail.com', 'Cebu', 'Active', 500, 500, 'Drivers and caregivers.'),
  ('f6f48653-dc48-5522-b53a-b03e9141680c', 'Ronaldo Espino', 'رونالدو إسبينو', '+63 920 447 1180', 'respino.recruit@yahoo.com', 'Davao', 'Inactive', 450, 450, 'Paused while his DMW accreditation is renewed.')
on conflict (id) do update set name_en = excluded.name_en, name_ar = excluded.name_ar, phone = excluded.phone, email = excluded.email, area = excluded.area, status = excluded.status, selection_fee = excluded.selection_fee, deployment_fee = excluded.deployment_fee, notes = excluded.notes;

insert into ops.employers (id, english_name, arabic_name, email, phone, telephone, national_address, national_id_number, national_address_short_code, status)
values
  ('6f04dcff-5a8f-5939-b40d-07eaee39843c', 'Ahmed Al-Harbi', 'أحمد الحربي', 'ahmed.harbi@example.sa', '+966 55 123 0001', '+966 11 234 0001', 'Riyadh 12345, Al Olaya, 7830', '1023456789', 'RAHA1234', 'Active'),
  ('af526827-9bb3-5191-b3ad-92e3932c2341', 'Fahad Al-Mutairi', 'فهد المطيري', 'fahad.mutairi@example.sa', '+966 55 123 0002', '+966 12 234 0002', 'Jeddah 23456, Al Rawdah, 4410', '1034567890', 'JERA5678', 'Active'),
  ('71f26b47-63ee-5288-b69e-eb53882ab4f8', 'Salem Al-Qahtani', 'سالم القحطاني', 'salem.qahtani@example.sa', '+966 55 123 0003', '+966 13 234 0003', 'Dammam 34567, Al Faisaliyah, 2290', '1045678901', 'DAFA9012', 'Active'),
  ('f73d24e5-a08a-5b2b-bc21-e3fd2a6ba1bb', 'Khalid Al-Dosari', 'خالد الدوسري', 'khalid.dosari@example.sa', '+966 55 123 0004', '+966 11 234 0004', 'Riyadh 45678, Al Malqa, 3312', '1056789012', 'RAMA3456', 'Active'),
  ('1e791b58-de0e-52af-9f5c-654d9eb54025', 'Nasser Al-Shammari', 'ناصر الشمري', 'nasser.shammari@example.sa', '+966 55 123 0005', '+966 12 234 0005', 'Jeddah 56789, Al Salamah, 8871', '1067890123', 'JESA7890', 'Inactive')
on conflict (id) do update set english_name = excluded.english_name, arabic_name = excluded.arabic_name, email = excluded.email, phone = excluded.phone, telephone = excluded.telephone, national_address = excluded.national_address, national_id_number = excluded.national_id_number, national_address_short_code = excluded.national_address_short_code, status = excluded.status;

insert into ops.applicants (id, english_name, arabic_name, gender, dob, country, profession, type, experience_years, passport_no, passport_start, passport_end, id_number, phone, telephone, status, published_to_website, agency_id, agent_id)
values
  ('ce35e265-3b76-5b33-947d-c134526aa840', 'Maricel S. Dela Cruz', 'ماريسيل ديلا كروز', 'Female', '1996-03-14', 'Philippines', 'Housemaid', 'Domestic', 3, 'P1234567A', '2022-05-01', '2027-05-01', 'PH-1996-889021', '+63 917 123 4567', '', 'Selected', true, 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', '0b60732c-b39d-5745-a7fa-36cc75666b11'),
  ('900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'Rosalinda P. Santos', 'روزاليندا سانتوس', 'Female', '1990-07-22', 'Philippines', 'Housemaid', 'Domestic', 6, 'P7654321B', '2021-01-15', '2026-01-15', 'PH-1990-441209', '+63 917 234 5678', '', 'Deployed', true, '9b523278-8af4-5935-8584-3d9939348c43', '0b60732c-b39d-5745-a7fa-36cc75666b11'),
  ('813ebfb0-f7c7-58fd-8608-d0b8d491d114', 'Jonalyn M. Reyes', 'جونالين رييس', 'Female', '1999-11-02', 'Philippines', 'Caregiver', 'Domestic', 1, 'P2233445C', '2023-08-10', '2028-08-10', 'PH-1999-772015', '+63 917 345 6789', '', 'Available', false, 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', null),
  ('412fc1d4-dca6-5e49-948d-78e39764f6af', 'Ariel B. Fernandez', 'أرييل فرنانديز', 'Male', '1993-02-27', 'Philippines', 'Driver', 'Domestic', 5, 'P5566778D', '2022-11-01', '2027-11-01', 'PH-1993-903312', '+63 917 456 7890', '', 'Selected', true, '3769e31f-242d-5414-b83d-731252c0bfe6', 'ab874111-47ec-5fde-ba1a-5810c12f125d'),
  ('6e21ee56-da5f-5282-b3be-81f3caea4a8c', 'Miguel A. Torres', 'ميغيل توريس', 'Male', '1991-09-08', 'Philippines', 'Mechanic', 'Profession', 8, 'P8899001E', '2021-06-01', '2026-06-01', 'PH-1991-118820', '+63 917 567 8901', '', 'Available', true, '9b523278-8af4-5935-8584-3d9939348c43', null),
  ('cc68b6c1-6cda-57f9-b8a2-60574e1861f2', 'Divine Rose C. Aquino', 'ديفاين روز أكينو', 'Female', '1997-12-19', 'Philippines', 'Hairdresser', 'Profession', 4, 'P3344556F', '2023-02-10', '2028-02-10', 'PH-1997-556781', '+63 917 678 9012', '', 'Deployed', true, 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', null)
on conflict (id) do update set english_name = excluded.english_name, arabic_name = excluded.arabic_name, gender = excluded.gender, dob = excluded.dob, country = excluded.country, profession = excluded.profession, type = excluded.type, experience_years = excluded.experience_years, passport_no = excluded.passport_no, passport_start = excluded.passport_start, passport_end = excluded.passport_end, id_number = excluded.id_number, phone = excluded.phone, telephone = excluded.telephone, status = excluded.status, published_to_website = excluded.published_to_website, agency_id = excluded.agency_id, agent_id = excluded.agent_id;

insert into ops.applicant_experience (id, applicant_id, title, employer, years)
values
  ('28981a5c-53f7-5910-89b5-3d24721564a6', 'ce35e265-3b76-5b33-947d-c134526aa840', 'Housemaid', 'Private household, Dubai', 2),
  ('d75c0a36-9047-55e1-b3b5-7f9a79a9ddfe', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'Housemaid', 'Private household, Kuwait', 4),
  ('c19658af-f46d-5c7c-afe7-19539f8b55a3', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'Nanny', 'Private household, Manila', 2),
  ('67309be1-f878-5ece-aa52-9568af5f8b54', '412fc1d4-dca6-5e49-948d-78e39764f6af', 'Family Driver', 'Private household, Manila', 5),
  ('a0c642d0-ddda-5faa-a06f-02ac9af484f6', '6e21ee56-da5f-5282-b3be-81f3caea4a8c', 'Auto Mechanic', 'Toyota Manila Service Center', 8),
  ('576647dc-0144-5000-9abe-f93f543efb4d', 'cc68b6c1-6cda-57f9-b8a2-60574e1861f2', 'Hairstylist', 'Bella Salon, Cebu', 4)
on conflict (id) do update set applicant_id = excluded.applicant_id, title = excluded.title, employer = excluded.employer, years = excluded.years;

insert into ops.applicant_education (id, applicant_id, degree, institution, year)
values
  ('f05d848f-6e85-58ca-9fef-c0eaf54fa2ba', 'ce35e265-3b76-5b33-947d-c134526aa840', 'High School Diploma', 'Manila East High School', '2013'),
  ('9aa9b445-46ca-581a-b1a9-83623d96d798', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'High School Diploma', 'Cebu City National High School', '2008'),
  ('f06ae8b6-543f-5f19-983f-2586a42cec9d', '813ebfb0-f7c7-58fd-8608-d0b8d491d114', 'Caregiving NC II', 'TESDA Manila', '2022'),
  ('367bfa56-994a-5b70-80d3-64dd8fabdde4', '412fc1d4-dca6-5e49-948d-78e39764f6af', 'Bachelor''s, Automotive Technology', 'Cebu Technological University', '2015'),
  ('f50689e3-d105-5a1b-b0c2-c82c65e763c6', '6e21ee56-da5f-5282-b3be-81f3caea4a8c', 'Automotive Servicing NC II', 'TESDA Manila', '2014'),
  ('8915e52e-6caa-5949-bf8c-fc03a989bbc6', 'cc68b6c1-6cda-57f9-b8a2-60574e1861f2', 'Hairdressing NC II', 'TESDA Cebu', '2018')
on conflict (id) do update set applicant_id = excluded.applicant_id, degree = excluded.degree, institution = excluded.institution, year = excluded.year;

insert into ops.applicant_documents (id, applicant_id, name, category, uploaded_at)
values
  ('f4b2b634-86c7-5182-8eaf-0f750967d190', 'ce35e265-3b76-5b33-947d-c134526aa840', 'passport_scan.pdf', 'Identification', '2024-05-18T00:00:00Z'),
  ('00cf1d1e-c07b-5b6a-b608-92045f26b341', 'ce35e265-3b76-5b33-947d-c134526aa840', 'medical_clearance.pdf', 'Medical', '2024-05-23T00:00:00Z'),
  ('0502bd23-d081-5626-845b-57a20e3d0dff', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'passport_scan.pdf', 'Identification', '2024-03-30T00:00:00Z'),
  ('7207ca0a-d1f1-5e06-879d-7f7af1309d75', '412fc1d4-dca6-5e49-948d-78e39764f6af', 'passport_scan.pdf', 'Identification', '2024-05-15T00:00:00Z')
on conflict (id) do update set applicant_id = excluded.applicant_id, name = excluded.name, category = excluded.category, uploaded_at = excluded.uploaded_at;

insert into ops.applicant_notes (id, applicant_id, body, created_at)
values
  ('e69ed343-7812-5687-9ca4-c0bae154f5b0', 'ce35e265-3b76-5b33-947d-c134526aa840', 'First down payment released to Six Direction Resources Company.', '2024-05-27T00:00:00Z'),
  ('22f96022-4cb3-5158-bf91-6744dda3010b', 'ce35e265-3b76-5b33-947d-c134526aa840', 'Application received and file opened.', '2024-05-18T00:00:00Z'),
  ('9ff8697a-265b-5e84-9bba-cf321b8e12d4', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'Deployed successfully. Client confirmed arrival.', '2024-05-05T00:00:00Z'),
  ('b9fdde72-72ae-57ff-bdb6-b32becbc82a1', '813ebfb0-f7c7-58fd-8608-d0b8d491d114', 'On hold pending updated medical documents from client.', '2024-06-03T00:00:00Z')
on conflict (id) do update set applicant_id = excluded.applicant_id, body = excluded.body, created_at = excluded.created_at;

insert into ops.requests (id, type, contract_duration_months, applicant_id, employer_id, responsible_staff_id, agency_id, mosaned_number, notes_en, notes_ar)
values
  ('850f9da7-d8e8-555c-80d1-568bd3671593', 'Domestic', 24, 'ce35e265-3b76-5b33-947d-c134526aa840', '6f04dcff-5a8f-5939-b40d-07eaee39843c', '1c258b2d-8249-5639-85ae-82e7f494246d', 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', 'MSD-2024-88231', 'Client requested Tagalog-speaking applicant.', 'طلب العميل متقدمة تتحدث التاغالوغية.'),
  ('afa3404e-6f4b-502d-9c79-00abec818fb1', 'Domestic', 24, '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'af526827-9bb3-5191-b3ad-92e3932c2341', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', '9b523278-8af4-5935-8584-3d9939348c43', 'MSD-2024-77102', 'Experienced candidate, fast-tracked.', 'مرشحة ذات خبرة، تمت المعالجة السريعة.'),
  ('c8bdb2ef-5320-589d-8ddb-c71338b448a3', 'Domestic', 12, '813ebfb0-f7c7-58fd-8608-d0b8d491d114', '71f26b47-63ee-5288-b69e-eb53882ab4f8', '1c258b2d-8249-5639-85ae-82e7f494246d', 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', '', '', ''),
  ('431cedba-74aa-50f1-8897-7f4be11ec844', 'Domestic', 24, '412fc1d4-dca6-5e49-948d-78e39764f6af', 'f73d24e5-a08a-5b2b-bc21-e3fd2a6ba1bb', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', '3769e31f-242d-5414-b83d-731252c0bfe6', 'MSD-2024-65590', '', ''),
  ('cdf2a9dc-7d10-5746-9b51-332afc6744f8', 'Profession', 24, '6e21ee56-da5f-5282-b3be-81f3caea4a8c', '6f04dcff-5a8f-5939-b40d-07eaee39843c', '1c258b2d-8249-5639-85ae-82e7f494246d', '9b523278-8af4-5935-8584-3d9939348c43', '', 'Employer wants a workshop-certified mechanic.', 'يريد صاحب العمل ميكانيكيًا معتمدًا.'),
  ('0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Profession', 18, 'cc68b6c1-6cda-57f9-b8a2-60574e1861f2', 'af526827-9bb3-5191-b3ad-92e3932c2341', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', 'MSD-2024-51120', '', '')
on conflict (id) do update set type = excluded.type, contract_duration_months = excluded.contract_duration_months, applicant_id = excluded.applicant_id, employer_id = excluded.employer_id, responsible_staff_id = excluded.responsible_staff_id, agency_id = excluded.agency_id, mosaned_number = excluded.mosaned_number, notes_en = excluded.notes_en, notes_ar = excluded.notes_ar;

insert into ops.request_status_history (id, request_id, status, occurred_on, cost, payment_source_id, responsible_staff_id, attachment_path, attachment_name, attachment_type, attachment_size, notes)
values
  ('9c2c36ff-bcfc-5025-b02b-1572af6bd8ab', '850f9da7-d8e8-555c-80d1-568bd3671593', 'Passporting', '2024-05-20', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', '1c258b2d-8249-5639-85ae-82e7f494246d', null, null, null, null, 'Applicant already holds a valid passport.'),
  ('21c4bb9e-bff5-59d3-a73f-38ee44998ee8', '850f9da7-d8e8-555c-80d1-568bd3671593', 'Ticket to Manila', '2024-05-21', 45, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', '1c258b2d-8249-5639-85ae-82e7f494246d', null, 'ticket_manila.pdf', null, 0, ''),
  ('9db995ef-3ecc-57fa-91e3-43514b726ba5', '850f9da7-d8e8-555c-80d1-568bd3671593', 'Medical', '2024-05-23', 60, '0642ebee-02d7-56db-b2b6-76849d87ee5c', '1c258b2d-8249-5639-85ae-82e7f494246d', null, 'medical_receipt.pdf', null, 0, 'Passed medical exam.'),
  ('bddfb9e8-5bdd-5214-9dab-92a6ebde9ecf', '850f9da7-d8e8-555c-80d1-568bd3671593', 'Vaccine', '2024-05-24', 20, '0642ebee-02d7-56db-b2b6-76849d87ee5c', '1c258b2d-8249-5639-85ae-82e7f494246d', null, null, null, null, ''),
  ('d173e0cb-1b52-5dbf-a7be-2675186f80a1', '850f9da7-d8e8-555c-80d1-568bd3671593', 'Selected', '2024-05-27', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', null, null, null, null, 'First down payment to agent.'),
  ('5f9d371f-56ab-5084-863e-136f9cfcb949', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Passporting', '2024-04-02', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('d6a682cf-1b28-5e45-9ec3-e8b83de97fe4', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Ticket to Manila', '2024-04-03', 45, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('159dbf9b-134c-5f72-8bce-3310ec74bf20', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Medical', '2024-04-06', 60, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, 'medical_receipt.pdf', null, 0, ''),
  ('d870aa5d-1a2c-5f8d-b987-9532c13fe219', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Vaccine', '2024-04-07', 20, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('06c77914-544a-5cd2-bffa-16c46bc6f284', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Selected', '2024-04-10', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', null, null, null, null, ''),
  ('4abd9fd0-4a6a-58e8-ab8c-84a2e70833fd', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Contract', '2024-04-12', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, 'contract.pdf', null, 0, ''),
  ('1bd8a118-1756-5aa8-bce6-73da05bb6fba', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'TESDA', '2024-04-15', 24.01, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('63a6ee33-e30c-5650-8e87-ad867f02e296', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'OWWA', '2024-04-16', 0, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('331f24fd-3c96-5386-ae64-2a276374fcc8', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'PDOS', '2024-04-18', 15, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('8bf3fdd8-6e63-58cc-9574-3083e097f53d', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'ENJAZ', '2024-04-20', 0, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('133ee5c9-e3c2-5698-82ce-41551c010e33', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Biometric', '2024-04-22', 5, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('adc318ca-f3c7-538a-9f9e-12b318418b40', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Insurance', '2024-04-24', 38, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('571ae1b7-d8f1-5d5b-99df-6c9f9fecb93f', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'OEC', '2024-04-26', 38.41, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('225558cc-36cf-572e-b3ae-3e7c3661d98a', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Visa Stamping', '2024-04-28', 25, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('1f99e830-8203-552f-8d18-fcf8e3d320a5', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Ticket', '2024-05-02', 380, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, 'ticket_receipt.pdf', null, 0, ''),
  ('e0293a0b-8122-59a9-b3d8-1c23a9d29cc2', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Deployed', '2024-05-05', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', null, null, null, null, 'Second agent fee earned on deployment.'),
  ('bef15c25-a5af-54fc-98b5-5aa4afb05c44', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Back Out', '2024-06-20', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', null, null, null, null, 'Left the household and asked to return home.'),
  ('51fea94e-2607-56ae-9c22-2ef379229b6b', '431cedba-74aa-50f1-8897-7f4be11ec844', 'Passporting', '2024-05-17', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('3683e36a-cf32-56c4-99e2-f3d50df373b8', '431cedba-74aa-50f1-8897-7f4be11ec844', 'Ticket to Manila', '2024-05-18', 45, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('53fe87ca-be8a-52e2-8989-50d315c16848', '431cedba-74aa-50f1-8897-7f4be11ec844', 'Medical', '2024-05-20', 60, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, '')
on conflict (id) do update set request_id = excluded.request_id, status = excluded.status, occurred_on = excluded.occurred_on, cost = excluded.cost, payment_source_id = excluded.payment_source_id, responsible_staff_id = excluded.responsible_staff_id, attachment_path = excluded.attachment_path, attachment_name = excluded.attachment_name, attachment_type = excluded.attachment_type, attachment_size = excluded.attachment_size, notes = excluded.notes;

insert into ops.request_status_history (id, request_id, status, occurred_on, cost, payment_source_id, responsible_staff_id, attachment_path, attachment_name, attachment_type, attachment_size, notes)
values
  ('a0749bc0-d4a4-5e2e-abf2-778ad55bbff0', '431cedba-74aa-50f1-8897-7f4be11ec844', 'Vaccine', '2024-05-21', 20, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', null, null, null, null, ''),
  ('31084bf1-e85b-5e4e-ada5-62edd96a89c7', '431cedba-74aa-50f1-8897-7f4be11ec844', 'Selected', '2024-05-23', 0, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', null, null, null, null, ''),
  ('49f3ce60-338f-5a1b-8e95-517e166adaa6', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Selected', '2024-02-08', 150, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('91eb75f0-80dc-52af-8412-13e281a88a01', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'On Medical', '2024-02-12', 60, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('03e90299-58c3-58ca-a65b-3211cbf1dd66', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Vaccine', '2024-02-13', 20, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('77066d53-345e-5126-b63c-a6272dda153e', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'ENJAZ', '2024-02-16', 0, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('b04b45be-4019-5f2e-8bc7-89c3d9ca4e52', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Biometric', '2024-02-18', 5, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('819d0b87-a77a-59f5-bb45-eabf67a43e79', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'TESDA', '2024-02-20', 24.01, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('44586a89-efe5-5a4e-b947-b586c6d5f621', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'SVP', '2024-02-24', 50, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('ab19ea55-1f76-5d1b-8f7e-bda7e267a33b', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Visa Stamping', '2024-02-27', 25, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('674ee9f8-b8d0-5b62-9a6d-226ef4bad290', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Insurance', '2024-03-01', 38, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('31a1c017-ed91-5290-beed-9766865cedcf', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'OEC', '2024-03-03', 38.41, '0642ebee-02d7-56db-b2b6-76849d87ee5c', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('2a0901da-7c69-5693-99b2-a0f38819b64c', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Ticket', '2024-03-06', 380, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', null, null, null, null, ''),
  ('2186bf58-ceb7-560e-945f-09239ddfe3ff', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'Deployed', '2024-03-10', 150, 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', null, null, null, null, '')
on conflict (id) do update set request_id = excluded.request_id, status = excluded.status, occurred_on = excluded.occurred_on, cost = excluded.cost, payment_source_id = excluded.payment_source_id, responsible_staff_id = excluded.responsible_staff_id, attachment_path = excluded.attachment_path, attachment_name = excluded.attachment_name, attachment_type = excluded.attachment_type, attachment_size = excluded.attachment_size, notes = excluded.notes;

insert into ops.invoices (id, invoice_number, request_id, employer_id, agency_id, service_price, status, issued_on)
values
  ('0d575776-d37b-52f6-9eb8-0470ce056b04', 'INV-2024-0001', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'af526827-9bb3-5191-b3ad-92e3932c2341', '9b523278-8af4-5935-8584-3d9939348c43', 2200, 'Completed', '2024-04-02'),
  ('5047ae79-df41-5216-be3b-7b6d9022ad46', 'INV-2024-0002', '0685b331-8d2e-5dbd-a4ee-a49f221f92c6', 'af526827-9bb3-5191-b3ad-92e3932c2341', 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', 2600, 'Partial Payment', '2024-02-08'),
  ('14887e71-5a2d-540d-b95c-969b9c9cf5b3', 'INV-2024-0003', '850f9da7-d8e8-555c-80d1-568bd3671593', '6f04dcff-5a8f-5939-b40d-07eaee39843c', 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', 2100, 'Issued', '2024-05-20')
on conflict (id) do update set invoice_number = excluded.invoice_number, request_id = excluded.request_id, employer_id = excluded.employer_id, agency_id = excluded.agency_id, service_price = excluded.service_price, status = excluded.status, issued_on = excluded.issued_on;

insert into ops.invoice_payments (id, invoice_id, paid_on, amount, payment_source_id, attachment_path, attachment_name, attachment_type, attachment_size)
values
  ('4c11d219-2c79-564f-80f6-193dd6a3b3e5', '0d575776-d37b-52f6-9eb8-0470ce056b04', '2024-04-02', 1000, '0642ebee-02d7-56db-b2b6-76849d87ee5c', null, null, null, null),
  ('0a53d91e-7d10-5dce-9eca-51f4434ee265', '0d575776-d37b-52f6-9eb8-0470ce056b04', '2024-05-05', 1200, '0642ebee-02d7-56db-b2b6-76849d87ee5c', null, null, null, null),
  ('10c1ef39-6a3f-55a4-bb46-5b33118b8127', '5047ae79-df41-5216-be3b-7b6d9022ad46', '2024-02-08', 1300, '0642ebee-02d7-56db-b2b6-76849d87ee5c', null, null, null, null)
on conflict (id) do update set invoice_id = excluded.invoice_id, paid_on = excluded.paid_on, amount = excluded.amount, payment_source_id = excluded.payment_source_id, attachment_path = excluded.attachment_path, attachment_name = excluded.attachment_name, attachment_type = excluded.attachment_type, attachment_size = excluded.attachment_size;

insert into ops.payroll_entries (id, staff_id, period, basic_salary, overtime, allowances, status, attachment_path, attachment_name, attachment_type, attachment_size)
values
  ('07b24271-5d38-5332-be3b-ff1bdad6d3b2', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', '2024-04-01', 700, 60, 90, 'Paid', null, null, null, null),
  ('8cd6387a-0cb7-5eec-a9a9-dbe4ed22cf09', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', '2024-04-01', 450, 40, 60, 'Paid', null, null, null, null),
  ('4db9c03f-2cd2-55ce-bc64-6de35b5b812f', '1c258b2d-8249-5639-85ae-82e7f494246d', '2024-04-01', 450, 0, 60, 'Paid', null, null, null, null),
  ('71c40893-c411-5839-a5eb-8fd39b000980', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', '2024-04-01', 450, 70, 60, 'Paid', null, null, null, null),
  ('eb83effa-0b8f-56b2-bf9d-f559e6e889d9', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', '2024-05-01', 700, 45, 90, 'Paid', null, null, null, null),
  ('e05ca23c-08d7-58b2-9db3-c9d85df55c10', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', '2024-05-01', 450, 30, 60, 'Paid', null, null, null, null),
  ('b0863017-b191-54a2-b961-663cdfda5181', '1c258b2d-8249-5639-85ae-82e7f494246d', '2024-05-01', 450, 25, 60, 'Paid', null, null, null, null),
  ('fc93ff87-8fe0-5ce6-8436-99d11cb47b3b', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', '2024-05-01', 450, 55, 60, 'Paid', null, null, null, null),
  ('4b3915b2-ccaa-51ae-af9f-b07130a8c0f3', 'dd88dd1e-ebd7-5624-9a01-3eaa7c5e6ebc', '2024-06-01', 700, 0, 90, 'Paid', null, null, null, null),
  ('fde8548c-4d3b-5450-92cb-081b9ecf9a31', 'ac542bfa-b00f-5d81-a8df-e06b8e5ef673', '2024-06-01', 450, 20, 60, 'Pending', null, null, null, null),
  ('a93af028-4eb0-5176-b4ce-2c33190ae3cf', '1c258b2d-8249-5639-85ae-82e7f494246d', '2024-06-01', 450, 0, 60, 'Pending', null, null, null, null),
  ('73a00103-0639-55cc-89c1-f6410350087b', 'efaccfb1-c2fa-51b9-9cfb-2c7d923b3ddd', '2024-06-01', 450, 35, 60, 'Pending', null, null, null, null)
on conflict (id) do update set staff_id = excluded.staff_id, period = excluded.period, basic_salary = excluded.basic_salary, overtime = excluded.overtime, allowances = excluded.allowances, status = excluded.status, attachment_path = excluded.attachment_path, attachment_name = excluded.attachment_name, attachment_type = excluded.attachment_type, attachment_size = excluded.attachment_size;

insert into ops.office_expenses (id, item_en, item_ar, category, amount, spent_on, status, attachment_path, attachment_name, attachment_type, attachment_size)
values
  ('c7a0bdfd-fad0-5e25-9e8a-c27d29ed3fd9', 'Office Rent', 'إيجار المكتب', 'Rent', 320, '2024-04-05', 'Paid', null, null, null, null),
  ('e06c4eed-67dc-560d-bb90-80b807110e62', 'Electricity', 'الكهرباء', 'Utilities', 72, '2024-04-12', 'Paid', null, null, null, null),
  ('7bb73787-a765-5bdd-be8a-ef3ca487e605', 'Water', 'المياه', 'Utilities', 14, '2024-04-12', 'Paid', null, null, null, null),
  ('0ab1fb5e-ccaa-5b8c-add9-6f2c408b1c0c', 'Internet & Phone', 'الإنترنت والهاتف', 'Utilities', 38, '2024-04-18', 'Paid', null, null, null, null),
  ('542e5dd9-e930-55f4-9f75-831d49e9e48c', 'Office Rent', 'إيجار المكتب', 'Rent', 320, '2024-05-05', 'Paid', null, null, null, null),
  ('fe93b14d-48ba-5cd1-b056-0e7b048e8548', 'Electricity', 'الكهرباء', 'Utilities', 81, '2024-05-12', 'Paid', null, null, null, null),
  ('f021f30b-14ed-5f30-98a6-8fcc90728dfc', 'Worker Accommodation', 'سكن العمالة', 'Accommodation', 180, '2024-05-14', 'Paid', null, null, null, null),
  ('e3869a81-585d-5347-bb5b-e255335e9ecb', 'Office Supplies', 'مستلزمات مكتبية', 'Supplies', 46, '2024-05-22', 'Paid', null, null, null, null),
  ('cf9eaeac-0125-5d1e-9200-2b7cfde6142d', 'Office Rent', 'إيجار المكتب', 'Rent', 320, '2024-06-05', 'Paid', null, null, null, null),
  ('546c015d-b805-5dfd-92ea-f5c8bceee2df', 'Electricity', 'الكهرباء', 'Utilities', 68, '2024-06-12', 'Pending', null, null, null, null),
  ('ad0c5aa7-a18d-5da0-8466-7939dadf74e8', 'Courier & Documents', 'الشحن والمستندات', 'Logistics', 25, '2024-06-14', 'Pending', null, null, null, null)
on conflict (id) do update set item_en = excluded.item_en, item_ar = excluded.item_ar, category = excluded.category, amount = excluded.amount, spent_on = excluded.spent_on, status = excluded.status, attachment_path = excluded.attachment_path, attachment_name = excluded.attachment_name, attachment_type = excluded.attachment_type, attachment_size = excluded.attachment_size;

insert into ops.agency_contracts (id, agency_id, reference, price_per_worker, signed_on, expires_on, status, notes)
values
  ('9791f0de-7701-53d9-ab6b-64a68ec4dc3d', 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', 'SDR-2024-DOM-01', 2400, '2024-01-15', '2026-01-14', 'Active', 'Domestic placements, Riyadh and Jeddah.'),
  ('54ae2dd8-c991-5cad-89af-2feb0aed3ba8', '9b523278-8af4-5935-8584-3d9939348c43', 'PCM-2023-DOM-07', 2200, '2023-08-01', '2025-07-31', 'Active', 'Renewal under discussion.'),
  ('74bc4f16-6610-5231-a637-b6757ab3a2fb', '3769e31f-242d-5414-b83d-731252c0bfe6', 'GGO-2024-DOM-03', 2600, '2024-03-01', '2026-02-28', 'Active', '')
on conflict (id) do update set agency_id = excluded.agency_id, reference = excluded.reference, price_per_worker = excluded.price_per_worker, signed_on = excluded.signed_on, expires_on = excluded.expires_on, status = excluded.status, notes = excluded.notes;

insert into ops.agency_charges (id, agency_id, contract_id, applicant_id, request_id, milestone, amount, due_on, status, settled_on, payment_source_id)
values
  ('3a3593eb-c9a7-5567-9da5-ddc134f36a70', 'a1f0b744-dc89-57a8-9a6c-80b9855aa5ff', '9791f0de-7701-53d9-ab6b-64a68ec4dc3d', 'ce35e265-3b76-5b33-947d-c134526aa840', '850f9da7-d8e8-555c-80d1-568bd3671593', 'Selected', 1200, '2024-05-27', 'Paid', '2024-06-03', '0642ebee-02d7-56db-b2b6-76849d87ee5c'),
  ('418b0b37-00ef-5ade-b575-2109d07112a8', '9b523278-8af4-5935-8584-3d9939348c43', '54ae2dd8-c991-5cad-89af-2feb0aed3ba8', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Selected', 1100, '2024-04-10', 'Paid', '2024-04-16', '0642ebee-02d7-56db-b2b6-76849d87ee5c'),
  ('dc5cf221-0245-5936-a4c1-43c12a826fba', '9b523278-8af4-5935-8584-3d9939348c43', '54ae2dd8-c991-5cad-89af-2feb0aed3ba8', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Visa Issued', 1100, '2024-04-28', 'Paid', '2024-05-02', '0642ebee-02d7-56db-b2b6-76849d87ee5c'),
  ('fe72c2fa-f1ae-5ebf-b839-4eb9c49bc866', '3769e31f-242d-5414-b83d-731252c0bfe6', '74bc4f16-6610-5231-a637-b6757ab3a2fb', '412fc1d4-dca6-5e49-948d-78e39764f6af', '431cedba-74aa-50f1-8897-7f4be11ec844', 'Selected', 1300, '2024-05-23', 'Pending', null, null)
on conflict (request_id, milestone) do update set status = excluded.status, settled_on = excluded.settled_on, payment_source_id = excluded.payment_source_id;

insert into ops.agent_commissions (id, agent_id, applicant_id, request_id, milestone, amount, earned_on, status, paid_on, payment_source_id)
values
  ('1d8dbc4c-4d08-55a4-b5bc-009361d72ec7', '0b60732c-b39d-5745-a7fa-36cc75666b11', 'ce35e265-3b76-5b33-947d-c134526aa840', '850f9da7-d8e8-555c-80d1-568bd3671593', 'Selected', 500, '2024-05-27', 'Paid', '2024-05-29', 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99'),
  ('726e07b3-ccfe-5292-ad7f-920854cd1806', '0b60732c-b39d-5745-a7fa-36cc75666b11', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Selected', 500, '2024-04-10', 'Paid', '2024-04-12', 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99'),
  ('22ea0e61-689f-5d93-9529-0b182873bd64', '0b60732c-b39d-5745-a7fa-36cc75666b11', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', 'afa3404e-6f4b-502d-9c79-00abec818fb1', 'Deployed', 500, '2024-05-05', 'Pending', null, null),
  ('9691996f-2c79-5aa3-ba41-249e2c0bf795', 'ab874111-47ec-5fde-ba1a-5810c12f125d', '412fc1d4-dca6-5e49-948d-78e39764f6af', '431cedba-74aa-50f1-8897-7f4be11ec844', 'Selected', 500, '2024-05-23', 'Pending', null, null)
on conflict (request_id, milestone) do update set status = excluded.status, paid_on = excluded.paid_on, payment_source_id = excluded.payment_source_id;

insert into ops.backouts (id, request_id, applicant_id, deployed_on, returned_on, reason, liability, notes)
       values ('324bdd5b-784a-5ed8-a847-fb678b6db834', 'afa3404e-6f4b-502d-9c79-00abec818fb1', '900fba72-4ddf-52dd-9a12-f3f8c6ac056c', '2024-05-05', '2024-06-20', 'Could not settle with the household and asked to go home.', 'Company', 'Employer confirmed no dispute. Replacement offered under the contract.')
       on conflict (request_id) do update
         set reason = excluded.reason, notes = excluded.notes, liability = excluded.liability
       returning id;

insert into ops.backout_costs
           (id, backout_id, label_en, label_ar, category, amount, spent_on, status, payment_source_id,
            attachment_path, attachment_name, attachment_type, attachment_size)
         values ('66976016-115e-5b18-89b3-ef44f497391d', (select id from ops.backouts where request_id = 'afa3404e-6f4b-502d-9c79-00abec818fb1'), 'Return ticket to Manila', 'تذكرة العودة إلى مانيلا', 'Travel', 420, '2024-06-21', 'Paid', 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', null, null, null, null)
         on conflict (id) do update set
           backout_id = excluded.backout_id, label_en = excluded.label_en, label_ar = excluded.label_ar,
           category = excluded.category, amount = excluded.amount, spent_on = excluded.spent_on,
           status = excluded.status, payment_source_id = excluded.payment_source_id,
           attachment_name = excluded.attachment_name;

insert into ops.backout_costs
           (id, backout_id, label_en, label_ar, category, amount, spent_on, status, payment_source_id,
            attachment_path, attachment_name, attachment_type, attachment_size)
         values ('40ae44ae-4558-5e25-a090-82e2c87737ff', (select id from ops.backouts where request_id = 'afa3404e-6f4b-502d-9c79-00abec818fb1'), 'Accommodation while waiting', 'الإقامة أثناء الانتظار', 'Accommodation', 135, '2024-06-19', 'Paid', 'fddd5522-b5c2-5d33-8f0f-1d5f125a0d99', null, null, null, null)
         on conflict (id) do update set
           backout_id = excluded.backout_id, label_en = excluded.label_en, label_ar = excluded.label_ar,
           category = excluded.category, amount = excluded.amount, spent_on = excluded.spent_on,
           status = excluded.status, payment_source_id = excluded.payment_source_id,
           attachment_name = excluded.attachment_name;

insert into ops.backout_costs
           (id, backout_id, label_en, label_ar, category, amount, spent_on, status, payment_source_id,
            attachment_path, attachment_name, attachment_type, attachment_size)
         values ('c1eacba3-09ad-542d-8a7c-a70b069a99e6', (select id from ops.backouts where request_id = 'afa3404e-6f4b-502d-9c79-00abec818fb1'), 'Exit clearance and fees', 'تصريح المغادرة والرسوم', 'Government', 90, '2024-06-20', 'Pending', null, null, null, null, null)
         on conflict (id) do update set
           backout_id = excluded.backout_id, label_en = excluded.label_en, label_ar = excluded.label_ar,
           category = excluded.category, amount = excluded.amount, spent_on = excluded.spent_on,
           status = excluded.status, payment_source_id = excluded.payment_source_id,
           attachment_name = excluded.attachment_name;

insert into ops.notifications (id, title, detail, read_at, created_at)
values
  ('cb4516a0-2e05-5f29-a8b5-0d383fa49780', 'Status updated', 'Maricel S. Dela Cruz moved to Selected.', null, '2024-05-27T00:00:00Z'),
  ('fa7f043e-811d-5d4f-9376-2a5043565c58', 'Worker deployed', 'Rosalinda P. Santos has been deployed successfully.', null, '2024-05-05T00:00:00Z'),
  ('ddd7ec7a-10d4-589c-a80b-9bf0d08c4588', 'Payment received', 'Final payment received on invoice INV-2024-0001.', '2024-05-05T00:00:00Z', '2024-05-05T00:00:00Z')
on conflict (id) do update set title = excluded.title, detail = excluded.detail, read_at = excluded.read_at, created_at = excluded.created_at;

commit;
