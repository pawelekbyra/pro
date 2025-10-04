# Ting Tong WordPress Theme

This is a custom WordPress theme for the Ting Tong application, converted from a static HTML/CSS/JS project.

## Installation

There are two ways to install this theme:

### 1. Through the WordPress Admin Panel (Recommended)

1.  Create a `.zip` archive of the `ting-tong-theme` directory.
2.  In your WordPress dashboard, navigate to **Appearance > Themes**.
3.  Click the **Add New** button at the top of the page.
4.  Click the **Upload Theme** button.
5.  Choose the `.zip` file you created and click **Install Now**.
6.  Once installed, click **Activate**.

### 2. Using FTP

1.  Upload the entire `ting-tong-theme` directory to the `/wp-content/themes/` directory on your web server.
2.  In your WordPress dashboard, navigate to **Appearance > Themes**.
3.  You should see the "Ting Tong Theme" listed. Click the **Activate** button.

## Automated Deployment (CI/CD)

This repository is configured with a GitHub Action that automatically deploys the theme to your FTP server.

### How It Works

-   **Trigger:** The deployment process is triggered automatically on every `push` to the `main` branch.
-   **Action:** The workflow uses the `SamKirkland/FTP-Deploy-Action` to copy the contents of the `/ting-tong-theme/` directory to the specified location on your server.
-   **Destination:** The files are deployed to `/public_html/autoinstalator/wordpresspluslscache2/wp-content/themes/ting-tong-theme/`.

### Configuration

The deployment configuration is located in `.github/workflows/deploy.yml`. It relies on the following secrets being set in your GitHub repository's settings (**Settings > Secrets and variables > Actions**):

-   `FTP_SERVER`: The hostname of your FTP server (e.g., `ftp.yourdomain.com`).
-   `FTP_USERNAME`: Your FTP username.
-   `FTP_PASSWORD`: Your FTP password.

**Note:** The workflow is configured to exclude `node_modules`, `.git` files, and the `.github` directory from the deployment.

## Theme Structure

-   `style.css`: Contains the theme's header information and main styles.
-   `index.php`: The main template file that structures the front page.
-   `header.php`: Contains the `<head>` section and the opening `<body>` tag.
-   `footer.php`: Contains the closing `</body>` and `</html>` tags, and the `wp_footer()` call.
-   `functions.php`: Handles enqueuing scripts and styles, and localizing data for the JavaScript application.
-   `script.js`: The main JavaScript file for the application's frontend logic.
-   `/jajeco.jpg`, `/logsiks.png`, `/polutek.png`: Image assets for the theme.