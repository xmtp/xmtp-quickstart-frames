# **UInbox Widget**

<img src="UInbox.png"/>

The UInbox widget is a React component designed to provide a user interface for interacting with an inbox-like structure. It offers programmatic control to open and close the inbox and can be integrated into various parts of an application.

## **Installation**

Include the UInbox component in your project by importing it from the appropriate path:

```jsx
import { UInbox } from "./UWidgets/UInbox"; // Update the path based on your folder structure
```

## **Usage**

Integrating the UInbox component into your application is simple. Here's an example of how to include it in your component tree:

- **`wallet`**: (Optional) Sends the current signer of the wallet.
- **`env`**: XMTP developer environment. Read more [here](https://xmtp.org/docs/build/authentication#environments)

```jsx
<UInbox wallet={signer} env={"production"} />
```

## **Programmatic Control**

The UInbox widget can be controlled programmatically using global methods to open or close it. These methods provide flexibility in interacting with the UInbox across different components.

### **Open UInbox**

Use the following command to open the UInbox:

```jsx
window.uinbox.open();
```

### **Close UInbox**

Use the following command to close the UInbox:

```jsx
window.uinbox.close();
```

## **Example Integration**

Here's an example of how you can create buttons to open and close the UInbox within a section of your application:

```jsx

<section >
  <button onClick={() => window.uinbox.open()}>Open UInbox</button>
  <button onClick={() => window.uinbox.close()}>Close UInbox</button>
</section>

<UInbox />

```

## **Support**

For further information or assistance, please refer to the main documentation or contact support.
