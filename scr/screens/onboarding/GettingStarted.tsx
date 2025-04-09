import React from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Button } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigations/RootStackParamList";

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
        <Text style={styles.linkText}>Sign in</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

export default GettingStartedScreen;

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 50,
    height: 50,
    backgroundColor: "#F5F7FA",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    width: "80%"
  },
  illustrationContainer: {
    width: "120%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  button: {
    backgroundColor: "#7A5FFF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 30,
    marginBottom: 5,
    width: "65%",
    alignItems: 'center'
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  signInContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  signInText: {
    fontSize: 15,
    color: "#666",
  },
  linkText: {
    fontSize: 14,
    color: "#6B48FF",
    fontWeight: "bold",
  },
});
