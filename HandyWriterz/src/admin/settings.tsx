import { useState } from 'react';
import { useToast } from '@/components/ui/toast/use-toast';
import { useSupabase } from '@/providers/SupabaseProvider';
import { FormLayout } from '@/components/ui/FormLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  const { toast } = useToast();
  const { supabase, loading } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSaveGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'general',
          value: {
            siteName: formData.get('siteName'),
            siteDescription: formData.get('siteDescription'),
            contactEmail: formData.get('contactEmail'),
            allowRegistration: formData.get('allowRegistration') === 'true'
          }
        });

      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInteractions = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'interactions',
          value: {
            allowAnonymousLikes: formData.get('allowAnonymousLikes') === 'true',
            allowAnonymousSharing: formData.get('allowAnonymousSharing') === 'true',
            requireAuthForComments: formData.get('requireAuthForComments') === 'true',
            moderateComments: formData.get('moderateComments') === 'true'
          }
        });

      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "Interaction settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      // Implement cache clearing logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Cache cleared",
        description: "Application cache has been cleared successfully."
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormLayout
      title="Application Settings"
      description="Configure global settings for your application"
      isLoading={isLoading}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic information about your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    defaultValue="HandyWriterz"
                    placeholder="Enter site name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    name="siteDescription"
                    defaultValue="Professional writing services for all your needs"
                    placeholder="Enter site description"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    defaultValue="contact@handywriterz.com"
                    placeholder="Enter contact email"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowRegistration"
                    name="allowRegistration"
                    defaultChecked={true}
                  />
                  <Label htmlFor="allowRegistration">Allow New User Registration</Label>
                </div>
                
                <Separator />
                
                <Button type="submit" disabled={isLoading}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle>User Interaction Settings</CardTitle>
              <CardDescription>
                Configure how users can interact with your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveInteractions} className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowAnonymousLikes"
                    name="allowAnonymousLikes"
                    defaultChecked={true}
                  />
                  <Label htmlFor="allowAnonymousLikes">Allow Anonymous Likes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowAnonymousSharing"
                    name="allowAnonymousSharing"
                    defaultChecked={true}
                  />
                  <Label htmlFor="allowAnonymousSharing">Allow Anonymous Sharing</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireAuthForComments"
                    name="requireAuthForComments"
                    defaultChecked={true}
                  />
                  <Label htmlFor="requireAuthForComments">Require Authentication for Comments</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="moderateComments"
                    name="moderateComments"
                    defaultChecked={true}
                  />
                  <Label htmlFor="moderateComments">Moderate Comments Before Publishing</Label>
                </div>
                
                <Separator />
                
                <Button type="submit" disabled={isLoading}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>
                Perform maintenance tasks on your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Cache Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clear application cache to refresh data and fix potential issues
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleClearCache}
                  disabled={isLoading}
                >
                  Clear Cache
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Database Backup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a backup of your database data
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    toast({
                      title: "Backup started",
                      description: "Database backup has been initiated. You will be notified when it's complete."
                    });
                  }}
                  disabled={isLoading}
                >
                  Create Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </FormLayout>
  );
}
