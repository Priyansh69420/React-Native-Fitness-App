import Realm, {ObjectSchema} from 'realm';
import {createRealmContext} from '@realm/react'

export class User extends Realm.Object {
  static schema: ObjectSchema = {
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
  }
}

const realmConfig = {
  schema: [User],
  schemaVersion: 2,
}

export const { RealmProvider, useRealm, useObject, useQuery } = createRealmContext(realmConfig);