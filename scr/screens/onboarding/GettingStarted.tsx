import React from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Button } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigations/RootStackParamList";
import { RFValue, RFPercentage } from "react-native-responsive-fontsize";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "GettingStarted">;
const logo = require('../../assets/logo.png');
const illustrationImage = require('../../assets/illustrationImage.jpg');

const GettingStartedScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo}/>

      <Text style={styles.title}>Welcome to Fitness App</Text>
      <Text style={styles.subtitle}>
        The best UI kit for your next health and fitness project
      </Text>

      <View style={styles.illustrationContainer}>
        <Image source={illustrationImage} style={styles.illustrationImage} />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Signup")} 
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Log in</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

export default GettingStartedScreen;

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.05,
  },
  logo: {
    width: width * 0.13, 
    height: width * 0.13, 
    backgroundColor: "#F5F7FA",
    borderRadius: width * 0.065, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.025, 
  },
  logoText: {
    fontSize: RFValue(24, height), 
  },
  title: {
    fontSize: RFValue(24, height), 
    fontWeight: "bold",
    color: "#333",
    marginBottom: height * 0.0125, 
  },
  subtitle: {
    fontSize: RFValue(16, height), 
    color: "#666",
    textAlign: "center",
    marginBottom: height * 0.0375, 
    width: "80%"
  },
  illustrationContainer: {
    width: "120%",
    height: height * 0.35, 
    justifyContent: "center",
    alignItems: "center",
    marginVertical: height * 0.025, 
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  button: {
    backgroundColor: "#7A5FFF",
    paddingVertical: height * 0.01875, 
    paddingHorizontal: width * 0.1, 
    borderRadius: width * 0.0625, 
    marginTop: height * 0.0375, 
    marginBottom: height * 0.00625, 
    width: "75%",
    alignItems: 'center'
  },
  buttonText: {
    color: "#FFF",
    fontSize: RFValue(18, height), 
    fontWeight: "bold",
  },
  signInContainer: {
    flexDirection: "row",
    marginTop: height * 0.0125, 
  },
  signInText: {
    fontSize: RFValue(15, height), 
    color: "#666",
    lineHeight: RFValue(20, height),
  },
  linkText: {
    fontSize: RFValue(15, height), 
    color: "#6B48FF",
    fontWeight: "bold",
    lineHeight: RFValue(19.5, height),
  },
});
