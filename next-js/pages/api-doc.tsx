import { GetStaticProps, InferGetStaticPropsType } from "next";
import { createSwaggerSpec } from "next-swagger-doc";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

function ApiDoc({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  return <SwaggerUI spec={spec} />;
}

export const getStaticProps: GetStaticProps = async () => {
  let url =
    process.env.NODE_ENV === "production"
      ? "https://superbets.games/api"
      : "http://localhost:3000/api";

  const spec: Record<string, any> = createSwaggerSpec({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Superbets API Documentation",
        version: "1.0",
      },
      servers: [
        {
          url,
        },
      ],
      components: {
        securitySchemes: {
          API_KEY: {
            type: "apiKey",
            in: "header",
            name: "Authorization",
          },
        },
      },
    },
  });

  return {
    props: {
      spec,
    },
  };
};

export default ApiDoc;
