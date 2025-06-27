import Realm, { ObjectSchema } from 'realm';
import { createRealmContext } from '@realm/react';

export class Post extends Realm.Object {
  static readonly schema: ObjectSchema = {
    name: 'Post',
    primaryKey: 'id',
    properties: {
      id: 'string',
      userId: 'string',
      content: 'string',
      timestamp: 'date',
      imageUrl: 'string?',
      videoUrl: 'string?',
      likes: 'string[]',
      comments: 'string[]',
    },
  };
}

export class User extends Realm.Object {
  static readonly schema: ObjectSchema = {
    name: 'User',
    properties: {
      email: 'string',
      name: 'string',
      faceId: 'bool',
      profilePicture: 'string',
      goals: 'string[]',
      interests: 'string[]',
      gender: 'string',
      calories: 'int',
      isPremium: 'bool',
      planType: 'string',
      onboardingComplete: 'bool',
      userHeight: 'float',
      userWeight: 'float',
      calorieGoal: 'float',
      glassGoal: 'float',
      stepGoal: 'float',
      darkMode: 'bool', // Added darkMode field
    },
    primaryKey: 'email',
  };
}

export class NutritionInfo extends Realm.Object {
  static readonly schema: ObjectSchema = {
    name: 'NutritionInfo',
    properties: {
      id: 'string',
      calories: 'float',
      carb: 'float',
      fat: 'float',
      name: 'string',
      protein: 'float',
      quantity: 'float',
      portion: 'int?',
    },
    primaryKey: 'id',
  };
}

export class DailyProgress extends Realm.Object {
  static schema: ObjectSchema = {
    name: 'DailyProgress',
    primaryKey: 'date',
    properties: {
      date: 'string', // e.g., '2025-06-18'
      steps: 'int',
      calories: 'int',
      water: 'float',
    },
  };
}

const realmConfig = {
  schema: [User, NutritionInfo, Post, DailyProgress],
  schemaVersion: 11, // Incremented from 10
  migration: (oldRealm: Realm, newRealm: Realm) => {
    if (oldRealm.schemaVersion < 11) {
      const oldUsers = oldRealm.objects('User');
      const newUsers = newRealm.objects('User');

      for (let i = 0; i < oldUsers.length; i++) {
        newUsers[i].darkMode = false; // Set default darkMode to false
      }
    }
  },
};

let realmInstance: Realm | null = null;

export const getRealmInstance = async (): Promise<Realm> => {
  if (realmInstance) {
    return realmInstance;
  }

  realmInstance = await Realm.open(realmConfig);

  return realmInstance;
};

export const { RealmProvider, useRealm, useObject, useQuery } = createRealmContext(realmConfig);