# Diplomacy Online — User Acceptance Testing (UAT) Plan

**Course:** CSCI 3308 — Lab 10: Testing  
**Team:** The Diplomats  
**Repository:** https://github.com/The-Diplomats/Diplomacy    
**Prepared:** November 5, 2026  
**Updated:** November 8, 2026

## 1. Purpose and scope

This plan evaluates whether representative users can complete key tasks in Diplomacy Online. It covers three planned user-facing features:

1. **Account registration:** create an account using the registration form (`/register`).
2. **Account login:** sign in using an existing account (`/login`).
3. **Game Rules Page:** read the rules and return to the application (`/rules`; related to frontend issue #24).

The cases below are **acceptance targets**, not claims that formal UAT has passed. The Game Rules Page is implemented and was checked locally on feature branch `nathan/feat/24/game-rules` (PR #68), but its merge status and the deployed version must be confirmed before formal UAT. Registration and login behavior must be verified against the version selected for testing; the earlier project snapshot had forms without completed authentication submission.

## 2. Acceptance criteria

### Feature A — Registration
- A visitor can provide a display name, unique email, password, and matching password confirmation and submit the form.
- A successful registration gives clear confirmation or navigates to the documented next page; the user can subsequently sign in with the created credentials.
- A missing required field or mismatched confirmation prevents registration and displays actionable feedback.

### Feature B — Login
- A registered user can enter their email and password and reach the authenticated experience (for example, the lobby).
- Invalid credentials do not grant access and result in understandable feedback.
- Password input is visually masked while entered.

### Feature C — Game Rules Page (Issue #24)
- A visitor can open the Game Rules Page from the application's intended navigation or a documented direct route.
- The page clearly describes the objective (18 supply centers), diplomacy, orders, order resolution, retreats/adjustments, and winning/draw conditions.
- The page provides a working way back to the intended main menu or lobby, without losing navigation control.

## 3. Test environment and schedule

- **Environment:** Local development instance, or a team-approved deployed test environment.
- **Frontend:** React / TypeScript application in `ProjectSourceCode/apps/frontend` (Vite; normally `http://localhost:5173`).
- **Backend:** Express / TypeScript application in `ProjectSourceCode/apps/backend` (normally `http://localhost:3001`).
- **Data:** Disposable test accounts and test-only database records; do not use real passwords or production user data.
- **Browser/device:** Current Chrome on a desktop or laptop; optionally repeat on a mobile viewport.
- **Setup:** Follow `ProjectSourceCode/README.md` and the frontend/backend READMEs to configure the environment, install dependencies with pnpm, and start the application and required services. Confirm the frontend and backend are reachable before testing.
- **Application version/commit:** To be recorded at execution: `________________`.
- **Planned execution date:** During the project testing milestone; confirm exact date with the team: `________________`.

## 4. Testers and responsibilities

Recruit representative users outside the implementation team when feasible, such as classmates who have not worked on these features. **The lab does not require two different testers**: T1 and T2 are planned IDs and may be assigned to one person if necessary. If teammates act as proxies, document that limitation.

| Tester ID | Intended tester | Responsibility |
| --- | --- | --- |
| T1 | Representative user (to be recruited; outside team preferred) | Registration and login scenarios |
| T2 | Representative user (to be recruited; may be same person as T1) | Game Rules Page scenarios |

**Recruitment/coordinator:** Team member to be assigned: `________________`.

## 5. UAT test cases

The following table follows the Lab 10 UAT template shown in the assignment. Each feature has one successful-task case and one invalid-input or alternate-path case. **All formal UAT results remain Not run** until the assigned tester performs the steps.

| Test ID | Feature / requirement | Acceptance criterion | Preconditions | Test data | User steps | Expected result | Tester ID | Actual result | Status | Issue / follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UAT-01 | Registration / account creation | Required fields are identified; blank password blocks account creation | Registration page `/register` is open; user is signed out | Unique test display name and email; password left blank; confirmation blank | 1. Open `/register`.<br>2. Enter a unique display name and email.<br>3. Leave the password blank.<br>4. Submit. | Registration does not complete; feedback identifies the missing password; user can correct the form. | Planned: T1 | Not run | Not run | None yet |
| UAT-02 | Registration / account creation | Valid details create an account and provide confirmation | App running; user signed out; test email not previously registered; registration service available | Display name: `UAT Player`; email: unique disposable test email; password: `TestPass123!`; confirmation: `TestPass123!` | 1. Open `/register`.<br>2. Enter all required fields.<br>3. Click **Create account**.<br>4. Observe confirmation or navigation. | Registration succeeds; user receives clear confirmation or reaches the documented next page; new credentials can be used to sign in. | Planned: T1 | Not run | Not run | None yet |
| UAT-03 | Login / authentication | Valid registered credentials grant access to the authenticated experience | App running; user signed out; test account created and confirmed | Email: registered disposable test email; password: matching test password | 1. Open `/login`.<br>2. Enter valid credentials.<br>3. Click **Sign in**.<br>4. Observe the result. | User signs in successfully and reaches the intended authenticated page (such as `/lobby`). | Planned: T1 | Not run | Not run | None yet |
| UAT-04 | Login / authentication | Incorrect password cannot authenticate a user | App running; user signed out; known test account exists | Email: registered disposable test email; password: `WrongPass123!` | 1. Open `/login`.<br>2. Enter the registered email and incorrect password.<br>3. Click **Sign in**.<br>4. Observe feedback and access. | Sign-in is rejected; clear error feedback appears; user does not gain authenticated access. | Planned: T1 | Not run | Not run | None yet |
| UAT-05 | Game Rules / view rules (issue #24) | Visitors can access and understand the rules content | Game Rules Page integrated in the tested build; app running; lobby navigation available | No special account or test data required unless the team specifies otherwise | 1. Open `/lobby`.<br>2. Click **How to Play** (or visit `/rules` directly).<br>3. Read the sections. | `/rules` loads without error and displays the objective (18 supply centers), diplomacy, orders, resolution, retreats/adjustments, and winning/draw conditions in readable sections. | Planned: T2 | Not run | Not run | None yet |
| UAT-06 | Game Rules / return navigation (alternate path; issue #24) | Visitors can leave the rules and return to the intended application page, then reopen the rules | Rules page `/rules` is open; **Back to Lobby** link implemented | No special test data required | 1. Open `/rules`.<br>2. Click **Back to Lobby**.<br>3. Confirm the URL and lobby content.<br>4. Click **How to Play** to return to `/rules`. | User reaches `/lobby` without a broken link, blank page, or unexpected error and can return to `/rules`. | Planned: T2 | Not run | Not run | None yet |


## 6. Execution, defects, and retesting

For each test, the assigned tester records:

- **Actual result:** What was visibly observed, including the destination or error message.
- **Status:** `Pass`, `Fail`, or `Blocked` (retain `Not run` until executed).
- **Issue / follow-up:** GitHub issue link or short defect description, owner, and proposed fix when applicable.
- **Retest:** After a fix, repeat the same steps and record the new outcome and tested commit.

The final project report should include the executed results and observations. **Do not mark a case as passed before running it.**

## 7. Known dependencies and open decisions

- Registration and login require functioning backend endpoints, frontend submission logic, and suitable test accounts. These were not fully implemented in the uploaded snapshot.
- The Game Rules Page was implemented and locally checked on branch `nathan/feat/24/game-rules` (PR #68). Confirm that this code is included in the selected UAT build before running UAT-05 and UAT-06.
- Confirm the post-registration destination, authenticated landing page, UAT execution date, coordinator, and exact test commit with the team before execution.
- Local developer checks of the Game Rules Page are not formal T2 UAT observations; leave the table statuses as **Not run** until representative testers execute the scenarios.
