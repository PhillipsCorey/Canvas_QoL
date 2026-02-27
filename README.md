# tasqe
A Chrome Web Extension aimed at first-generation university students, aiming to help develop planning skills and improve productivity.

# Setup
## Requirements:
- Node.js ≥ v20
- npm ≥ v9

## 1: Clone repo
`git clone https://github.com/PhillipsCorey/tasque.git`

## 2: Install dependencies
```
cd Canvas_QoL
npm i
```

## 3: Build project
`npm run build`

The build step generates a `dist/` directory containing the Chrome-loadable extension files.

## 4: Load extension
- Open Chrome
- Go to `chrome://extensions`
- Toggle "Developer Mode" in the top-right
- Select the "Load Unpacked" button
- Navigate to the cloned project directory and select the `dist/` folder
