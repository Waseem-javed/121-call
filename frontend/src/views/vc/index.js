import Peer from "peerjs";
import { FaCopy } from "react-icons/fa6";
import { io } from "socket.io-client";
import React, { useEffect, useRef, useState } from "react";

const VideoCall = () => {
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [participantId, setParticipantId] = useState("");

  const myVideo = useRef();
  const otherVideo = useRef();
  const currentCall = useRef(null);

  useEffect(() => {
    // Initialize Socket.io
    const socketInstance = io("http://localhost:5000");
    setSocket(socketInstance);

    // Initialize PeerJS
    const peerInstance = new Peer();
    setPeer(peerInstance);

    // Setup PeerJS ID
    peerInstance.on("open", (id) => {
      setMyId(id);
    });

    // Get user media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myVideo.current.srcObject = stream;
        myVideo.current.play();

        peerInstance.on("call", (call) => {
          setIncomingCall(call);

          // Auto-answer the call when accepted
          call.on("stream", (remoteStream) => {
            otherVideo.current.srcObject = remoteStream;
            otherVideo.current.play();
          });
        });
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    return () => {
      socketInstance.disconnect();
      peerInstance.destroy();
    };
  }, []);

  const handleCall = () => {
    if (!participantId) return alert("Enter a participant ID");
    const stream = myVideo.current.srcObject;

    const call = peer.call(participantId, stream);

    call.on("stream", (remoteStream) => {
      otherVideo.current.srcObject = remoteStream;
      otherVideo.current.play();
    });

    currentCall.current = call;
  };

  const handleAccept = () => {
    const stream = myVideo.current.srcObject;

    incomingCall.answer(stream);
    incomingCall.on("stream", (remoteStream) => {
      otherVideo.current.srcObject = remoteStream;
      otherVideo.current.play();
    });

    setCallAccepted(true);
    setIncomingCall(null);
  };

  const handleReject = () => {
    incomingCall.close();
    setIncomingCall(null);
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      alert('ID copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy ID: ', err);
    });
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Video Call</h1>
      <div className="flex flex-grow space-x-4 mb-4">
        <div className="flex-col h-full">
          <h2 className="text-sm">You</h2>
          <video
            ref={myVideo}
            muted
            className="border rounded-md"
            style={{ width: "300px" }}
          />
        </div>
        <div className="flex-col h-full">
          <h2 className="text-sm">Participant's Video</h2>
          <video
            ref={otherVideo}
            className="border rounded-md"
            style={{ width: "300px" }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center mt-4">
        <div className="flex items-center gap-1 border rounded-lg">
            <span className="text-sm rounded-lg text-white font-medium bg-black p-3">YOUR ID:</span>
        <h3 className="bg-dark">{myId}</h3>
        <button
            onClick={() => copyToClipboard(myId)}
            className="p-2 rounded-md hover:bg-gray-200"
            >
            <FaCopy className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Enter Participant ID"
          className="mt-2 border rounded p-2"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        />
        <button
          onClick={handleCall}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Call Participant
        </button>
      </div>

      {incomingCall && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <h4 className="text-md font-bold">Incoming Call</h4>
          <p>From: {incomingCall.peer}</p>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleAccept}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
