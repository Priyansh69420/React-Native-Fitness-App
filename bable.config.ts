module.exports = {
    presets: ["module:metro-react-native-babel-preset"],
    plugins: [
        // Add this line as the LAST plugin in the array
        "react-native-reanimated/plugin",
    ],
};
