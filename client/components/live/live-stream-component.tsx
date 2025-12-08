"use client";

import React from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MonitorStop,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateToken, generateUidFromPublicKey } from "@/lib/stream";

export interface LiveStreamHandle {
  leaveChannel: () => Promise<void>;
}

interface LiveStreamProps {
  isCreator: boolean;
  channelId: string;
  onStreamStateChange?: (
    isActive: boolean,
    role: "host" | "audience" | null
  ) => void;
}

const LiveStreamComponent = React.forwardRef<LiveStreamHandle, LiveStreamProps>(
  ({ channelId, isCreator, onStreamStateChange }, ref) => {
    const wallet = useWallet();
    const clientRef = React.useRef<IAgoraRTCClient | null>(null);
    const [localAudioTrack, setLocalAudioTrack] =
      React.useState<IMicrophoneAudioTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] =
      React.useState<ICameraVideoTrack | null>(null);
    const [screenTrack, setScreenTrack] =
      React.useState<ILocalVideoTrack | null>(null);
    const [isJoined, setIsJoined] = React.useState(false);
    const [role, setRole] = React.useState<"host" | "audience" | null>(null);
    const [remoteUsers, setRemoteUsers] = React.useState<
      Map<number | string, IAgoraRTCRemoteUser>
    >(new Map());
    const [totalUserCount, setTotalUserCount] = React.useState(0);
    const [isAudioMuted, setIsAudioMuted] = React.useState(false);
    const [isVideoOff, setIsVideoOff] = React.useState(false);
    const [isScreenSharing, setIsScreenSharing] = React.useState(false);
    const [showControls, setShowControls] = React.useState(false);
    const [controlsTimeout, setControlsTimeout] =
      React.useState<NodeJS.Timeout | null>(null);
    const [isConnecting, setIsConnecting] = React.useState(false);
    const [loadingMessage, setLoadingMessage] = React.useState("");
    const [agoraToken, setAgoraToken] = React.useState<string | null>(null);

    const localVideoRef = React.useRef<HTMLDivElement>(null);
    const remoteVideosRef = React.useRef<HTMLDivElement>(null);

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

    React.useEffect(() => {
      if (typeof window === "undefined") return;

      AgoraRTC.setLogLevel(4);

      const client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === "video") {
          setRemoteUsers((prev) => new Map(prev).set(user.uid, user));
        }

        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(user.uid);
            return newMap;
          });
        }
      });

      client.on("user-joined", (user) => {
        setTotalUserCount((prev) => prev + 1);
      });

      client.on("user-left", (user) => {
        setRemoteUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(user.uid);
          return newMap;
        });
        setTotalUserCount((prev) => Math.max(0, prev - 1));
      });

      return () => {
        client.removeAllListeners();
      };
    }, []);

    React.useEffect(() => {
      if (localVideoTrack && localVideoRef.current && !isScreenSharing) {
        setTimeout(() => {
          if (localVideoRef.current && localVideoTrack) {
            localVideoTrack.play(localVideoRef.current);
          }
        }, 50);
      }

      if (screenTrack && localVideoRef.current && isScreenSharing) {
        setTimeout(() => {
          if (localVideoRef.current && screenTrack) {
            screenTrack.play(localVideoRef.current);
          }
        }, 50);
      }
    }, [localVideoTrack, screenTrack, isScreenSharing]);

    React.useEffect(() => {
      return () => {
        if (localVideoTrack) {
          localVideoTrack.stop();
        }
        if (screenTrack) {
          screenTrack.stop();
        }
      };
    }, [localVideoTrack, screenTrack]);

    React.useEffect(() => {
      if (role === "host" && localVideoTrack && localVideoRef.current) {
        setTimeout(() => {
          if (localVideoRef.current && localVideoTrack) {
            localVideoTrack.play(localVideoRef.current);
          }
        }, 100);
      }
    }, [role, localVideoTrack]);

    React.useEffect(() => {
      remoteUsers.forEach((user) => {
        const container = document.getElementById(`remote-${user.uid}`);
        if (user.videoTrack && container) {
          user.videoTrack.play(container);
        }
      });
    }, [remoteUsers]);

    React.useEffect(() => {
      if (onStreamStateChange) {
        onStreamStateChange(isJoined, role);
      }
    }, [isJoined, role, onStreamStateChange]);

    React.useImperativeHandle(ref, () => ({
      leaveChannel,
    }));

    const handleMouseMove = () => {
      if (!isJoined) return;

      setShowControls(true);

      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }

      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);

      setControlsTimeout(timeout);
    };

    async function createLocalTracks() {
      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        return { audioTrack, videoTrack };
      } catch (error) {
        console.error("Error creating local tracks:", error);
        throw error;
      }
    }

    async function joinAsHost() {
      try {
        if (!clientRef.current || !wallet.publicKey) return;

        setIsConnecting(true);
        setLoadingMessage("Connecting to stream...");

        const token = await generateToken(
          1,
          setLoadingMessage,
          wallet.publicKey.toString(),
          channelId
        );
        if (!token) {
          setIsConnecting(false);
          setLoadingMessage("");
          return;
        }

        setAgoraToken(token);
        const publicKeyStr = wallet.publicKey.toString();
        const uid = generateUidFromPublicKey(publicKeyStr);

        setLoadingMessage("Setting up host role...");
        await clientRef.current.setClientRole("host");

        setLoadingMessage("Joining channel...");
        await clientRef.current.join(appId, channelId, token, uid);

        setLoadingMessage("Setting up camera and microphone...");
        const { audioTrack, videoTrack } = await createLocalTracks();

        setLoadingMessage("Publishing stream...");
        await clientRef.current.publish([audioTrack, videoTrack]);

        setIsJoined(true);
        setRole("host");
        setTotalUserCount(1);
        setShowControls(true);
        setIsConnecting(false);
        setLoadingMessage("");

        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }
        const t = setTimeout(() => setShowControls(false), 3000);
        setControlsTimeout(t);
      } catch (error) {
        console.error("Error joining as host:", error);
        setIsConnecting(false);
        setLoadingMessage("Failed to connect");
        setTimeout(() => setLoadingMessage(""), 3000);
      }
    }

    async function joinAsAudience() {
      try {
        if (!clientRef.current || !wallet.publicKey) return;

        setIsConnecting(true);
        setLoadingMessage("Connecting to stream...");

        const token = await generateToken(
          0,
          setLoadingMessage,
          wallet.publicKey.toString(),
          channelId
        );
        if (!token) {
          setIsConnecting(false);
          setLoadingMessage("");
          return;
        }

        setAgoraToken(token);
        const publicKeyStr = wallet.publicKey.toString();
        const uid = generateUidFromPublicKey(publicKeyStr);

        setLoadingMessage("Setting up viewer role...");
        const clientRoleOptions = { level: 2 };
        await clientRef.current.setClientRole("audience", clientRoleOptions);

        setLoadingMessage("Joining channel...");
        await clientRef.current.join(appId, channelId, token, uid);

        setIsJoined(true);
        setRole("audience");
        setTotalUserCount(1);
        setShowControls(true);
        setIsConnecting(false);
        setLoadingMessage("");

        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }
        const t = setTimeout(() => setShowControls(false), 3000);
        setControlsTimeout(t);
      } catch (error) {
        console.error("Error joining as audience:", error);
        setIsConnecting(false);
        setLoadingMessage("Failed to connect");
        setTimeout(() => setLoadingMessage(""), 3000);
      }
    }

    async function leaveChannel() {
      try {
        if (localAudioTrack) {
          localAudioTrack.close();
          setLocalAudioTrack(null);
        }
        if (localVideoTrack) {
          localVideoTrack.close();
          setLocalVideoTrack(null);
        }
        if (screenTrack) {
          screenTrack.close();
          setScreenTrack(null);
        }

        if (clientRef.current) {
          await clientRef.current.leave();
        }

        setRemoteUsers(new Map());
        setIsJoined(false);
        setRole(null);
        setTotalUserCount(0);
        setIsAudioMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
          setControlsTimeout(null);
        }
      } catch (error) {
        console.error("Error leaving channel:", error);
      }
    }

    async function toggleMute() {
      if (!localAudioTrack) return;

      try {
        await localAudioTrack.setEnabled(isAudioMuted);
        setIsAudioMuted(!isAudioMuted);
      } catch (error) {
        console.error("Error toggling mute:", error);
      }
    }

    async function toggleVideo() {
      if (!localVideoTrack || !clientRef.current) return;

      try {
        await localVideoTrack.setEnabled(isVideoOff);
        setIsVideoOff(!isVideoOff);
      } catch (error) {
        console.error("Error toggling video:", error);
      }
    }

    async function toggleScreenShare() {
      if (!clientRef.current) return;

      try {
        if (isScreenSharing) {
          if (screenTrack) {
            screenTrack.close();
            await clientRef.current.unpublish(screenTrack);
            setScreenTrack(null);
          }

          if (localVideoTrack) {
            await clientRef.current.publish(localVideoTrack);
          }

          setIsScreenSharing(false);
        } else {
          const newScreenTrack = await AgoraRTC.createScreenVideoTrack(
            {
              encoderConfig: "1080p_1",
              optimizationMode: "detail",
            },
            "auto"
          );

          const screenVideoTrack = Array.isArray(newScreenTrack)
            ? newScreenTrack[0]
            : newScreenTrack;

          if (localVideoTrack) {
            await clientRef.current.unpublish(localVideoTrack);
          }
          await clientRef.current.publish(screenVideoTrack);
          setScreenTrack(screenVideoTrack);
          screenVideoTrack.on("track-ended", async () => {
            await toggleScreenShare();
          });

          setIsScreenSharing(true);
        }
      } catch (error) {
        console.error("Error toggling screen share:", error);
        setIsScreenSharing(false);
      }
    }

    return (
      <div className="relative">
        <div
          className={`flex items-center justify-center w-full ${
            isJoined ? "hidden" : "h-96"
          }`}
        >
          <div className="flex gap-4 flex-wrap">
            {isCreator ? (
              !isJoined ? (
                <div className="w-full flex flex-col items-center justify-center py-8 gap-4">
                  <Button
                    onClick={joinAsHost}
                    id="start-stream"
                    size="lg"
                    className="px-8 py-8 rounded-none text-lg"
                    disabled={isConnecting || !wallet.publicKey}
                  >
                    {isConnecting ? "Connecting..." : "Start Streaming"}
                  </Button>
                  {!wallet.publicKey && (
                    <p className="text-sm text-muted-foreground">
                      Please Login with your wallet first
                    </p>
                  )}
                  {loadingMessage && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {loadingMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground"></div>
              )
            ) : !isJoined ? (
              <div className="w-full flex flex-col items-center justify-center py-8 gap-4">
                <Button
                  onClick={joinAsAudience}
                  id="join-stream"
                  size="lg"
                  className="px-8 py-8 rounded-none text-lg"
                  disabled={isConnecting || !wallet.publicKey}
                >
                  {isConnecting ? "Connecting..." : "Join Stream"}
                </Button>
                {!wallet.publicKey && (
                  <p className="text-sm text-muted-foreground">
                    Please Login with your wallet first
                  </p>
                )}
                {loadingMessage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {loadingMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground"></div>
            )}
          </div>
        </div>
        <div className="">
          {role === "host" && (
            <div className="space-y-2">
              {localVideoTrack || screenTrack ? (
                <div
                  className="relative w-full aspect-video h-full bg-black border overflow-hidden"
                  onMouseMove={handleMouseMove}
                >
                  <div
                    ref={localVideoRef}
                    id={`local-player`}
                    className="w-full h-full"
                  />
                  {role === "host" && isJoined && (
                    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                      <div
                        className={cn(
                          "bg-black bg-opacity-50 flex items-center pointer-events-auto transition-opacity border divide-x",
                          showControls ? "opacity-100" : "opacity-0"
                        )}
                      >
                        <button onClick={toggleMute} className="px-5 py-3 cursor-pointer bg-black/10 backdrop-blur-sm ">
                          {isAudioMuted ? (
                            <MicOff className="w-4 h-4 text-destructive" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>

                        <button className="px-5 py-3 cursor-pointer bg-black/10 backdrop-blur-sm " onClick={toggleVideo}>
                          {isVideoOff ? (
                            <VideoOff className="w-4 h-4 text-destructive" />
                          ) : (
                            <VideoIcon className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          className="px-5 py-3 cursor-pointer bg-black/10 backdrop-blur-sm "
                          onClick={toggleScreenShare}
                        >
                          {isScreenSharing ? (
                            <MonitorStop className="w-4 h-4 text-destructive" />
                          ) : (
                            <MonitorUp className="w-4 h-4" />
                          )}
                        </button>

                        <button className="px-5 py-2 cursor-pointer bg-destructive text-red-50 backdrop-blur-sm " onClick={leaveChannel}>
                          Stop
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video bg-muted border rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground">
                  Loading camera...
                </div>
              )}
            </div>
          )}

          {role === "audience" && (
            <div className="space-y-2">
              {remoteUsers.size > 0 ? (
                <div ref={remoteVideosRef} className="grid grid-cols-1 gap-4">
                  {Array.from(remoteUsers.values()).map((user) => (
                    <div key={user.uid} className="space-y-1">
                      <div
                        className="relative w-full aspect-video h-full bg-black border overflow-hidden"
                        onMouseMove={handleMouseMove}
                      >
                        <div
                          id={`remote-${user.uid}`}
                          className="w-full h-full"
                        >
                          {!user.videoTrack && (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              Audio only
                            </div>
                          )}
                        </div>

                        {isJoined && (
                          <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                            <div
                              className={cn(
                                "bg-black bg-opacity-50 rounded-full flex gap-2 items-center pointer-events-auto transition-opacity",
                                showControls ? "opacity-100" : "opacity-0"
                              )}
                            >
                              <Button
                                onClick={leaveChannel}
                                size="sm"
                                className="rounded-none py-6"
                                variant="destructive"
                              >
                                Stop Watching
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full aspect-video bg-muted border overflow-hidden flex items-center justify-center text-muted-foreground">
                  Stream is offline.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

LiveStreamComponent.displayName = "LiveStreamComponent";

export default LiveStreamComponent;
