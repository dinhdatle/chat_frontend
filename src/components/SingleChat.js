import React, { useEffect, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  Toast,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { ProfileModal } from "./miscellaneous/ProfileModal";
import UpdateGroupChatModel from "./miscellaneous/UpdateGroupChatModel";
import axios from "axios";
import "./style.css";
import ScrollableChat from "./ScrollableChat";
import { io } from "socket.io-client";

var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const { user, selectedChat, setSelectedChat } = ChatState();
  const [socketConnected, setSocketConnected] = useState(false);

  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await axios.get(
        `https://chat-server-5gca.onrender.com/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    socket = io("https://chat-server-5gca.onrender.com");
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    // socket.on("typing", () => setTyping(true));
    // socket.on("stop typing", () => setTyping(false));
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        // noti
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.post(
          "https://chat-server-5gca.onrender.com/api/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        setNewMessage("");
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    // if(!socketConnected) return

    // if(!typing){
    //   setTyping(true);
    //   socket.emit("typing", selectedChat._id);
    // }
  };
  return (
    <>
      {selectedChat ? (
        <>
          <Text
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            width="100%"
            px={2}
            fontFamily="work sans"
            fontSize={{ base: "18px", md: "30px" }}
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              onClick={() => setSelectedChat("")}
              icon={<ArrowBackIcon />}
            />

            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal
                  user={getSenderFull(user, selectedChat.users)}
                ></ProfileModal>
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModel
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                ></UpdateGroupChatModel>
              </>
            )}
          </Text>

          <Box
            display="flex"
            flexDirection="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            h="100%"
            w="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl onKeyDown={sendMessage} isRequired marginTop={4}>
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message"
                value={newMessage}
                onChange={typingHandler}
              ></Input>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
