# Hosted Website Demo Walkthrough

Use this guide while screen-sharing the hosted website. No local servers,
Stripe CLI listener, or database setup is needed during the presentation.
Allow about 15-20 minutes for the main walkthrough.

Sprint references identify the requirements demonstrated by each section.
This walkthrough is self-contained so presenters can read it directly from
the frontend repository.

## 1. Prepare before presenting

**Sprint items: S2-T02, S2-T11, S2-T24**

1. Open [the hosted website](https://ctu-pizza-demo.netlify.app).
2. Check [API health through Netlify](https://ctu-pizza-demo.netlify.app/api/v1/health).
   It should return `{"status":"ok"}`.
3. Check [the database-backed menu](https://ctu-pizza-demo.netlify.app/api/v1/menu).
   It should return menu data, not an error.
4. Confirm the Railway backend, PostgreSQL database, and `pizza-worker` are
   running. Keep API keys, database variables, and console credentials off-screen.
5. Prepare three separate browser profiles or browsers:

   | Session | Account role | Purpose |
   | --- | --- | --- |
   | Customer | `customer` | Profile, cart, payment, history and email |
   | Staff | `staff` | Order queue and status changes |
   | Management | `administrator` | Menu, promotions and audit |

   Tabs in the same browser profile share a login. Signing in to another account
   there replaces the first session; use separate profiles/browsers.
6. Use the customer account whose email exactly matches the Resend account email.
   The test sender `onboarding@resend.dev` cannot email arbitrary recipients.
7. Keep Stripe open in the same sandbox used by the application, and open the
   recipient's mailbox. Hide unrelated transactions and personal messages.
8. Disable any 100% discount offer so checkout requires a sandbox payment.
   Keep a spare customer account available for an optional decline/access test.

Hosted menu/database access, a Stripe sandbox order, and a delivered Resend
confirmation were confirmed during preparation on November 4, 2026.
Staff transitions and management checks should still be rehearsed before presenting.

## 2. Introduce the home page and sign in

**Sprint items: S1-T06, S1-T09, S1-T12, S1-T15/T16**

1. Open **Home** and show the restaurant information, hours and current offers.
2. Briefly show **Register** and its required fields. Use an existing customer
   for the main walkthrough rather than creating duplicate accounts.
3. Open **Account**, sign in as the customer, and show the customer navigation.

Say: "This is the hosted capstone demo. Payments use Stripe sandbox mode;
no real money moves and no food is fulfilled."

## 3. Update the customer profile

**Sprint item: S1-T10**

1. Open **Profile**.
2. Update the name or phone number using synthetic demo details.
3. Set the address to `123 Main St, Denver, CO 80014`.
4. Click **Save profile**, then reload to show that the changes persist.

Keep the customer email matching the Resend account so confirmation delivery
can be demonstrated.

## 4. Browse, customize and build a cart

**Sprint items: S1-T11, S1-T13/T14, S1-T18/T19/T20/T21/T22**

1. Open **Menu & order**. Show categories, prices and an unavailable item,
   if one is configured.
2. Click **Choose options** on an available pizza.
3. Choose a size, crust, topping and quantity, then click **Add to cart**.
4. Add the same pizza with a different topping to show distinct configurations.
5. Open **Cart** and show the selected options and quantities.
6. Change a quantity and click **Update quantity**.
7. Show subtotal, the best eligible promotion if any, tax and total.
8. Reload to show that the cart persists. Keep at least one valid line for checkout.

Say: "Prices, valid combinations, tax and promotions are calculated by the
server. Only the best eligible promotion applies."

Do not promise a fixed total: management changes and active offers affect it.

## 5. Review and pay with Stripe sandbox

**Sprint items: S2-T02/T03/T04/T05/T06/T07/T08**

1. Click **Review & checkout**.
2. Show the order review and prefilled contact details.
3. Select **Delivery** and show the saved address. Switch to **Pickup** if that
   is the fulfillment method chosen for the presentation.
4. Confirm the total and click **Accept total & continue to payment**.
5. In Stripe's hosted payment fields, enter:

   | Field | Test value |
   | --- | --- |
   | Card number | `4242 4242 4242 4242` |
   | Expiry | Any future date, such as `12/30` |
   | CVC | `123` |
   | ZIP, if requested | `80014` |

6. Click **Authorize payment & place order** once.
7. Wait for the saved order confirmation.
8. In the Stripe sandbox, open **Transactions** and show the matching payment's
   final **Succeeded** status, not merely an uncaptured authorization.

Never use a real card. If the result is uncertain, use
**Check payment / order status** rather than starting another payment.

## 6. Show confirmation, history and email

**Sprint items: S2-T08/T09/T10/T11**

1. Show the confirmation's order number, items, total, fulfillment and status.
2. Open **Order history**, reopen the order, then reload to show persistence.
3. Open **Cart** and show that the purchased lines were removed.
4. Wait about 30-60 seconds for the worker and show the confirmation email.
5. If needed, check [Resend Emails](https://resend.com/emails) and the spam folder.
   Do not claim delivery until the message actually arrives.

Say: "The confirmation email is sent in the background after the order is
saved. Status updates do not send additional emails in this version."

Save the order number so staff can identify this exact demo order.

## 7. Process the order as staff

**Sprint items: S1-T07, S2-T12/T13/T14**

1. In the staff browser, sign in and open **Staff queue**.
2. Find the new order by its number. Allow about ten seconds for visible-page
   refresh, or reload if needed.
3. Show the items, customizations, contact details and fulfillment method.
4. Click **Mark preparing**, then **Mark ready**.
5. In the customer browser, open the order details and show the changed status.
   Details refresh about every 15 seconds while visible; reload if needed.
6. Return to staff and click **Mark completed**.
7. Show that the order leaves the active queue but remains in customer history.

Say: "Orders must follow Received -> Preparing -> Ready -> Completed.
Staff and administrators can process orders; customers cannot."

## 8. Manage a menu item

**Sprint items: S2-T15/T17**

1. In the management browser, open **Manage restaurant**.
2. Open **Create menu item**. Enter a demo name, description, existing category,
   price, and a working HTTPS image URL.
3. Select **Side / drink / other** and make the item available.
4. Click **Create item**. Reload the customer menu to show it immediately.
5. Expand the item, change its price, and click **Save item**.
6. Reload the customer menu to show the new price.
7. Uncheck availability and save to show the unavailable state.
8. Use **Archive item -> Confirm archive** to remove the temporary item from
   the customer menu.

Use a direct image URL, not a webpage URL. Test it before presenting.
Creating categories, topping options and pizza size/crust combinations can be
shown here if time permits.

Say: "Menu changes publish without a redeploy. Existing orders retain their
original item names, options and prices."

## 9. Manage a promotion and show audit history

**Sprint items: S1-T14/T22, S2-T16/T17**

1. In **Manage restaurant**, create a clearly named demo promotion:
   percent discount, value `10`, minimum subtotal `20`, starts yesterday,
   expires tomorrow, and enabled.
2. Reload the customer menu to show the offer.
3. Explain that only the best eligible offer applies; an existing better offer
   may still win in the cart.
4. Disable the demo promotion and save. To remove it entirely, expand the offer,
   click **Delete promotion**, then **Confirm delete promotion**. **Keep promotion**
   cancels the action. Deleted offers stop applying; saved orders keep their discounts.
5. Click **View audit history** and expand the menu/promotion changes to show
   the actor, timestamp, and before/after values.

## 10. Optional negative and usability checks

**Sprint items: S1-T07/T08/T15/T16, S2-T04/T06/T07/T10/T18/T19/T22/T23**

Use only the checks needed for your presentation; do not lock out the main accounts.

| Check | Steps and expected result |
| --- | --- |
| Decline | As a customer, attempt checkout with test card `4000 0000 0000 0002`, a future expiry and CVC `123`. Show the decline, retained cart and no new saved order. Cancel the checkout before editing the cart. |
| Delivery validation | Enter an incomplete delivery address and show the validation error. Restore a complete address afterward. |
| Role restriction | As a customer, open `https://ctu-pizza-demo.netlify.app/#admin`. Management access is denied. |
| Server restriction | As a customer, open `https://ctu-pizza-demo.netlify.app/api/v1/admin/catalog`. Expect HTTP 403. |
| Order ownership | In a second customer's browser session, open the first customer's confirmation URL. Expect Order not found. |
| Logout | Sign out and open a protected page. Sign-in is required. |
| Keyboard/mobile | Demonstrate Skip to content and keyboard controls, then show a narrow viewport without horizontal overflow. |

Five failed logins trigger the default 15-minute lockout; inactivity expiry is
also 15 minutes. Mention these or show automated test results rather than
waiting during the presentation. Do not claim a browser demonstration proves
concurrency, refund recovery, 3DS or load targets unless those were separately tested.

## 11. Finish

**Sprint item: S2-T24**

1. Recap the hosted flow: customer order -> Stripe sandbox payment -> saved
   order/history -> confirmation email -> staff fulfillment -> manager updates.
2. Disable temporary promotions, archive demo items, and sign out.
3. Keep the hosted services running until the presentation and grading are done.
4. After the demo, preserve required evidence/code before deleting the Railway
   project/database and Netlify project. Revoke demo provider keys and check
   subscriptions/billing separately.

For frontend setup and deployment details, see [README.md](README.md).
