import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

import styles from "../styles/Home.module.scss";

const preHome: NextPage = () => {
  const router = useRouter();
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Estabelecer conexão WebSocket
    const socket = new WebSocket("ws://192.168.1.44:420"); // Certifique-se de que a porta está correta e acessível

    socket.onopen = () => {
      console.log("Conexão WebSocket estabelecida");
      // Enviar mensagem de identificação
      const initMessage = JSON.stringify({ type: 'device', device: 'frontend' });
      socket.send(initMessage);
    };

    socket.onmessage = (event) => {
      const message = event.data;
      console.log("Mensagem recebida do servidor:", message);

      try {
        const data = JSON.parse(message);
        if (data.type === 'card') {
          handleCardUID(data.uid);
        }
      } catch (e) {
        console.error('Erro ao processar a mensagem:', e);
      }
    };

    socket.onclose = () => {
      console.log("Conexão WebSocket fechada");
    };

    socket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    setWs(socket);

    // Limpar na desmontagem do componente
    return () => {
      socket.close();
    };
  }, []);

  const handleCardUID = (uid: string) => {
    // Remover espaços em branco e converter para minúsculas, se necessário
    const cardUID = uid.trim().toLowerCase();

    if (cardUID === "c37137aa") {
      // Redirecionar para a página de usuário normal
      router.push("/123"); // Substitua "/123" pela rota desejada
    } else if (cardUID === "3b5bb280") {
      // Redirecionar para a página do usuário estrangeiro
      router.push({
        pathname: "/123", // Substitua "/123" pela rota desejada
        query: {
          stranger: true,
        },
      });
    } else {
      // UID não reconhecido
      alert("Cartão não reconhecido");
    }
  };

  return (
    <>
      <Head>
        <title>Entre numa sala</title>
      </Head>
      <section className={styles.main}>
        <input
          type="text"
          placeholder="Aproxime o cartão"
          // O input pode não ser necessário se a entrada for via cartão
          disabled
          className="glow"
        />
        <button
          type="button"
          disabled
          // Os botões podem ser removidos se a ação for automática via cartão
          className="glow"
        >
          Entrar como usuário
        </button>
        <button
          type="button"
          disabled
          className="glow"
        >
          Entrar como o &quot;estrangeiro&quot;
        </button>
      </section>
    </>
  );
};

export default preHome;
