# Creating the Firebase Project

Before we dive into the Ionic app, we need to make sure we actually have a Firebase app configured. If you already got something in place you can of course skip this step.

Otherwise, make sure you are signed up (it’s free) and then hit Add project inside the [Firebase console](https://console.firebase.google.com/). Give your new app a name, select a region and then create your project!

Once you have created the project you need to find the web configuration which looks like this:

![image](https://user-images.githubusercontent.com/73944895/187245878-2cec7029-c923-48d7-b1ee-02c43ee38b9e.png)

If it’s a new project, click on the web icon below “Get started by adding Firebase to your app” to start a new web app and give it a name, you will see the configuration in the next step now.

Leave this config block open (or copy it already) until our app is ready so we can insert it in our environment!

Additionally we have to enable the database, so select Firestore Database from the menu and click Create database.
