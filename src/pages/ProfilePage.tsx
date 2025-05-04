
import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PatreonConnect from '@/components/PatreonConnect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-gamedev-primary mb-8">My Profile</h1>
        
        <Tabs defaultValue="account">
          <TabsList className="mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="memberships">Memberships</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <div className="space-y-6">
              <Card className="bg-black border-gamedev-primary/20 text-white">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm text-gray-400">Email</h3>
                    <p>{user?.email || "Not signed in"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="memberships">
            <div className="space-y-6">
              <PatreonConnect />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProfilePage;
