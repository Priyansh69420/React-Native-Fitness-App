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
  schemaVersion: 10, // Incremented from 9
};

let realmInstance: Realm | null = null;

export const getRealmInstance = async (): Promise<Realm> => {
  if (realmInstance) {
    return realmInstance;
  }

  realmInstance = await Realm.open({
    schema: [User, NutritionInfo, Post, DailyProgress],
    schemaVersion: 10,
  });

  return realmInstance;
};

export const { RealmProvider, useRealm, useObject, useQuery } = createRealmContext(realmConfig);