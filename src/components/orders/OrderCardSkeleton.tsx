import React from 'react';
import { Card, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const OrderCardSkeleton = () => {
  return (
    <Card className="flex flex-col justify-between animate-pulse">
      <CardHeader className="flex-row items-center justify-between p-4">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
      </CardFooter>
    </Card>
  );
};
