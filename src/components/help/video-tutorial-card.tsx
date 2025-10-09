'use client';

import { useState } from 'react';
import { Play, Clock, FileDown, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VideoTutorial } from '@/lib/help-content';

interface VideoTutorialCardProps {
  tutorial: VideoTutorial;
  userPlan?: 'free' | 'pro' | 'enterprise';
}

export function VideoTutorialCard({ tutorial, userPlan = 'free' }: VideoTutorialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const isLocked = tutorial.enterpriseOnly && userPlan !== 'enterprise';
  const canWatch = !isLocked && !tutorial.isComingSoon;

  const handlePlayClick = () => {
    if (isLocked) {
      window.location.href = '/dashboard/settings?tab=subscription';
      return;
    }

    if (tutorial.isComingSoon) {
      return;
    }

    // In a real implementation, this would open a video modal or navigate to video page
    console.log('Playing video:', tutorial.id);
  };

  return (
    <Card
      id={`tutorial-${tutorial.id}`}
      className={`overflow-hidden transition-all ${isLocked ? 'opacity-75' : ''}`}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden group cursor-pointer">
        {/* Placeholder thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isLocked ? (
            <Lock className="w-16 h-16 text-white/50" />
          ) : (
            <div
              onClick={handlePlayClick}
              className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white"
            >
              <Play className="w-10 h-10 text-blue-600 ml-1" />
            </div>
          )}
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/80 text-white rounded-md flex items-center space-x-1 text-sm">
          <Clock className="w-4 h-4" />
          <span>{tutorial.duration} min</span>
        </div>

        {/* Coming Soon Badge */}
        {tutorial.isComingSoon && (
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Wkrótce
            </Badge>
          </div>
        )}

        {/* Enterprise Badge */}
        {tutorial.enterpriseOnly && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Enterprise
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardHeader>
        <CardTitle className="text-lg">{tutorial.title}</CardTitle>
        <CardDescription>{tutorial.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Points */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">W tym tutorialu:</h4>
          <ul className="space-y-1">
            {tutorial.summary.map((point, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handlePlayClick}
            disabled={!canWatch}
            className="flex-1"
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Upgrade do Enterprise
              </>
            ) : tutorial.isComingSoon ? (
              'Wkrótce dostępne'
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Odtwórz
              </>
            )}
          </Button>

          {tutorial.transcript && (
            <Button
              variant="outline"
              onClick={() => setShowTranscript(!showTranscript)}
              disabled={isLocked}
            >
              {showTranscript ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ukryj transkrypcję
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Transkrypcja
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            disabled={isLocked || tutorial.isComingSoon}
          >
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>

        {/* Transcript */}
        {showTranscript && tutorial.transcript && !isLocked && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Transkrypcja:</h4>
            <div className="text-sm text-gray-600 whitespace-pre-line max-h-64 overflow-y-auto">
              {tutorial.transcript}
            </div>
          </div>
        )}

        {/* Locked Message */}
        {isLocked && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              Ten tutorial jest dostępny tylko dla użytkowników planu Enterprise.{' '}
              <a href="/dashboard/settings?tab=subscription" className="underline font-medium">
                Sprawdź plany
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Grid layout for tutorials
export function VideoTutorialsGrid({
  tutorials,
  userPlan,
}: {
  tutorials: VideoTutorial[];
  userPlan?: 'free' | 'pro' | 'enterprise';
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tutorials.map((tutorial) => (
        <VideoTutorialCard
          key={tutorial.id}
          tutorial={tutorial}
          userPlan={userPlan}
        />
      ))}
    </div>
  );
}
